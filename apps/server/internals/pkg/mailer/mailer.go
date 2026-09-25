package mailer

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
	"sync"

	"coursehunt/server/internals/config"
)

type MailMessage struct {
	To      string
	Subject string
	HTML    string
}

type Mailer struct {
	cfg    *config.Config
	queue  chan MailMessage
	stopCh chan struct{}
	wg     sync.WaitGroup
}

func New(cfg *config.Config) *Mailer {
	m := &Mailer{
		cfg:    cfg,
		queue:  make(chan MailMessage, 1024),
		stopCh: make(chan struct{}),
	}
	m.startWorker()
	return m
}

func (m *Mailer) startWorker() {
	m.wg.Add(1)
	go func() {
		defer m.wg.Done()
		for {
			select {
			case <-m.stopCh:
				// Drain remaining queue
				for len(m.queue) > 0 {
					msg := <-m.queue
					m.sendRaw(msg)
				}
				return
			case msg := <-m.queue:
				m.sendRaw(msg)
			}
		}
	}()
}

func (m *Mailer) Stop() {
	close(m.stopCh)
	m.wg.Wait()
}

func (m *Mailer) SendAsync(to, subject, htmlContent string) {
	select {
	case m.queue <- MailMessage{To: to, Subject: subject, HTML: htmlContent}:
	default:
		log.Printf("[mailer] queue saturated, dropping email to %s", to)
	}
}

func (m *Mailer) sendRaw(msg MailMessage) {
	addr := fmt.Sprintf("%s:%d", m.cfg.SMTPHost, m.cfg.SMTPPort)

	var auth smtp.Auth
	if m.cfg.SMTPUsername != "" && m.cfg.SMTPPassword != "" {
		auth = smtp.PlainAuth("", m.cfg.SMTPUsername, m.cfg.SMTPPassword, m.cfg.SMTPHost)
	}

	headers := make(map[string]string)
	headers["From"] = m.cfg.SMTPFrom
	headers["To"] = msg.To
	headers["Subject"] = msg.Subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	var body bytes.Buffer
	for k, v := range headers {
		body.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	body.WriteString("\r\n")
	body.WriteString(msg.HTML)

	err := smtp.SendMail(addr, auth, m.cfg.SMTPFrom, []string{msg.To}, body.Bytes())
	if err != nil {
		log.Printf("[mailer] failed to send email to %s: %v (host=%s)", msg.To, err, addr)
		return
	}
	log.Printf("[mailer] sent email %q to %s", msg.Subject, msg.To)
}

// ── Transactional Email Templates ──

const welcomeTemplate = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to CourseHunt</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">
    <h2 style="color: #0f172a; margin-top: 0;">Welcome to CourseHunt, {{.Name}}!</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      We're thrilled to have you join our learning community. Explore high-quality tech courses taught by industry veterans and accelerate your career.
    </p>
    <div style="margin: 28px 0;">
      <a href="https://coursehunt.com/courses" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Explore Catalog</a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      If you did not create an account on CourseHunt, please ignore this email.
    </p>
  </div>
</body>
</html>
`

const orderReceiptTemplate = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Confirmation</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">
    <div style="display: flex; align-items: center; margin-bottom: 24px;">
      <span style="font-size: 24px; font-weight: bold; color: #2563eb;">CourseHunt</span>
    </div>
    <h2 style="color: #0f172a; margin-top: 0;">Payment Received!</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      Hi {{.Name}}, your enrollment in <strong>{{.CourseTitle}}</strong> is now confirmed.
    </p>
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #334155;">
        <span>Order Reference:</span><strong>{{.OrderID}}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 14px; color: #334155;">
        <span>Amount Paid:</span><strong>{{.Amount}}</strong>
      </div>
    </div>
    <div style="margin: 28px 0;">
      <a href="https://coursehunt.com/student/learn" style="background: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Start Learning Now</a>
    </div>
  </div>
</body>
</html>
`

const certificateIssuedTemplate = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Certificate Earned</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">
    <h2 style="color: #0f172a; margin-top: 0;">Congratulations, {{.Name}}!</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
      You have successfully completed <strong>{{.CourseTitle}}</strong> and earned your official certificate of completion.
    </p>
    <div style="margin: 28px 0;">
      <a href="{{.CertURL}}" style="background: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View & Verify Certificate</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">
      You can add this credential directly to your LinkedIn profile and resume.
    </p>
  </div>
</body>
</html>
`

func (m *Mailer) SendWelcome(to, name string) {
	tmpl, _ := template.New("welcome").Parse(welcomeTemplate)
	var buf bytes.Buffer
	_ = tmpl.Execute(&buf, map[string]string{"Name": name})
	m.SendAsync(to, "Welcome to CourseHunt!", buf.String())
}

func (m *Mailer) SendOrderReceipt(to, name, courseTitle, orderID, amount string) {
	tmpl, _ := template.New("receipt").Parse(orderReceiptTemplate)
	var buf bytes.Buffer
	_ = tmpl.Execute(&buf, map[string]string{
		"Name":        name,
		"CourseTitle": courseTitle,
		"OrderID":     orderID,
		"Amount":      amount,
	})
	m.SendAsync(to, "Your CourseHunt Enrollment Receipt", buf.String())
}

func (m *Mailer) SendCertificateIssued(to, name, courseTitle, certURL string) {
	tmpl, _ := template.New("cert").Parse(certificateIssuedTemplate)
	var buf bytes.Buffer
	_ = tmpl.Execute(&buf, map[string]string{
		"Name":        name,
		"CourseTitle": courseTitle,
		"CertURL":     certURL,
	})
	m.SendAsync(to, fmt.Sprintf("Certificate Earned: %s", courseTitle), buf.String())
}
