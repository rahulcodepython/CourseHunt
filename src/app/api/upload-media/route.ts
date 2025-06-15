export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const fileType = formData.get("fileType") as string;

        if (!file || !fileType) {
            return new Response(JSON.stringify({ error: "Invalid file or fileType" }), { status: 400 });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
        const REPO = process.env.GITHUB_REPO!;
        const USERNAME = process.env.GITHUB_USERNAME!;
        const BRANCH = process.env.GITHUB_BRANCH || 'main';

        const arrayBuffer = await file.arrayBuffer();
        const content = Buffer.from(arrayBuffer).toString('base64');
        const filename = file.name;

        const path = `course-hunt/${fileType === "image" ? "images" : fileType === "video" ? "videos" : fileType === "document" ? "documents" : ""}/${filename}`;
        const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/contents/${path}`;

        let sha: string | undefined;

        const existingFileRes = await fetch(`${apiUrl}?ref=${BRANCH}`, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (existingFileRes.ok) {
            const existingFileData = await existingFileRes.json();
            sha = existingFileData.sha;
        }

        const uploadRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: sha ? `Update ${filename}` : `Upload ${filename}`,
                content,
                sha,
                branch: BRANCH,
            }),
        });

        const data = await uploadRes.json();

        if (!uploadRes.ok) {
            return new Response(JSON.stringify({ error: data.message || 'Failed to upload to GitHub' }), { status: uploadRes.status, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({
            downloadUrl: data.content.download_url,
            htmlUrl: data.content.html_url,
            status: uploadRes.status,
        }));
    } catch (error) {
        console.error("Error generating upload auth params:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}