# Command File
## Current Command
1. the make a course read api is giving an error and there is no sign of showing a course i completed on not. in the all enrolled courses api for student, attach one more attribute that is completed or not. and after completing a course entirely show some ui changes to look like that course is done.
2. remove the dashboard/course page. as all enrolled courses are shown directly in the dashboard page. so this page is not needed anymore.
3. create a section of CRUD for updated where admins can create update and delete the recent updated. this holds date, title, description. and in the dashboard, there is a section recent updates there these updates will be visible. also create a table where we can see that a update is read by any user or not. already read updates will not be visible anymore to a user. and it will take one api. a single api will fetch all the unseen updates for a user. along with this api call before returning the response marks all of those updates as the user has seen. 
4. see the dashboard page has three distict section one is stats, one is enrolled courses, one is updates. wrap all of them under `parallal routes`. use three parallal routes, one for stats, one for enrolled courses, one for updates.
5. fix `Invalid src prop (https://lh3.googleusercontent.com/a/ACg8ocKp5Nisx7jY4R4VrDXyCYw7BYPiA8jfQ_bskH43yUBMcBL6QwY=s96-c) on `next/image`, hostname "lh3.googleusercontent.com" is not configured under images in your `next.config.js`` in the profile page.
6. add a action into the adminpanel/feedback page where we can delete a feedback and also pin the feedback. and the pinned feedback will be shown at the testimonial section in the landing page.
7. show a stats in the transaciton, total revenue, monthly revenue, total refunds, pending refunds. and in the transaction tables show the refund button under action column and show which user have made this transaction.
8. create a refund section. add a attributed to the transaction table that will state the transaction status ('ideal', 'pending', 'refunded'). add one more button under action column that will be initiate refund. and if the transaction status is 'ideal' then the refund button will be visible and it will trigger an api call which change the status from 'ideal' to 'pending' to that user. otherwise if the status is 'pending' two more button will be visible 1. accept, 2. reject. if it is accepted then change the status from 'pending' to 'refunded' to that user and it will revoke all the access of that particular course from that particular user. if it is rejected then chnage the status from 'pending' to 'ideal' to that user. if the status is 'refunded' then no action button will be visible. 
9. add some stats above the transaction page that will be 1. total revenue, 2. revenue this month, 3. total refunds, 4. pending refunds.
10. in the user table under admin panel page, remove showing unnecessary data and show only relevent like position, joined, how many courses enrolled in, then show some action button like ban, unban. if the user is banned then the user will not be able to login and if the user is unbanned then the user will be able to login.  and one more action button that will be change the role switch the position between admin, tutor, user.
11. banned users will be shown a restricted page after they banned and while they will going to login they will be redirected to that restricted page which mentioned that he is banned contact some officials
12. add a separate dashboard for tutor where tutor only course crud and feedback read page will be there. only tutor can create, edit, delete courses. and view their course feedback.
13. add a discussion table. where one enrolled users can discuss any thing over a lesson and tutor of that course can answer them also. create CRUD api for discussion. add a discussion tab with input box and all discussion.
14. make sure admins has default access of all the courses along with all the chapters and lessons. and tutor only has access of their created courses and all the chapters & lessons. not others. 
---
## Command Rules
* Must be specific
* Must include:
* Feature / Bug / Refactor
* Scope (files/modules)
* Expected outcome
---
## Execution Rules
* Follow constraints.md strictly
* Follow architecture.md layers
* Update checklist.md before starting
* Do not modify unrelated files
---
## AI Behavior
* No assumptions beyond scope
* No extra features
* Minimal token usage
* Maximum correctness
