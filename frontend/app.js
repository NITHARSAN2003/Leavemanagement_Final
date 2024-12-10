const http = require("http");
const fs = require("fs").promises;
const path = require("path");

async function renderPage(layoutFile, contentFile) {
    try {
        let layout = await fs.readFile(layoutFile, "utf8");
        let content = await fs.readFile(contentFile, "utf8");

        // Extract <style> block
        const styleStart = content.indexOf("<style>");
        const styleEnd = content.indexOf("</style>");

        let style = "";
        if (styleStart !== -1 && styleEnd !== -1) {
            style = content.substring(styleStart, styleEnd + "</style>".length);
            content =
                content.substring(0, styleStart) +
                content.substring(styleEnd + "</style>".length);
        }

        // Extract <script> block
        const scriptStart = content.indexOf("<script>");
        const scriptEnd = content.indexOf("</script>");

        let script = "";
        if (scriptStart !== -1 && scriptEnd !== -1) {
            script = content.substring(scriptStart, scriptEnd + "</script>".length);
            content =
                content.substring(0, scriptStart) +
                content.substring(scriptEnd + "</script>".length);
        }

        // Replace placeholders with actual content
        const renderedPage = layout
            .replace("{{content}}", content)
            .replace("{{style}}", style)
            .replace("{{script}}", script);

        return renderedPage;
    } catch (err) {
        throw err;
    }
}

const server = http.createServer(async (req, res) => {
    // Handle static file requests
    if (req.url.startsWith("/static/")) {
        const filePath = path.join(__dirname, req.url);
        try {
            const data = await fs.readFile(filePath);
            res.writeHead(200, { "Content-Type": getContentType(filePath) });
            res.end(data);
            return;
        } catch (err) {
            res.writeHead(404, { "Content-Type": "text/html" });
            return res.end("<h1>404 Not Found</h1>");
        }
    }

    // Handle HTML page requests
    let filePath = "./views/index.html";
    let layout_use = "./layouts/layout_with_topnav.html";

    if (req.url === "/") {
        filePath = "./views/index.html";
        layout_use = "./layouts/layout_with_topnav.html";
    } else if (req.url === "/employees") {
        filePath = "./views/employees/index.html";
        layout_use = "./layouts/layout_with_topnav.html";
    } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        return res.end("<h1>404 Not Found</h1>");
    }

    try {
        let renderedPage = await renderPage(layout_use, filePath);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(renderedPage);
    } catch (err) {
        console.log(err);
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end("<h1>500 Internal Server Error</h1>");
    }
});

// Function to determine content type
function getContentType(filePath) {
    const extname = path.extname(filePath);
    switch (extname) {
        case ".css":
            return "text/css";
        case ".js":
            return "application/javascript";
        case ".png":
            return "image/png";
        case ".jpg":
            return "image/jpeg";
        case ".gif":
            return "image/gif";
        case ".svg":
            return "image/svg+xml";
        case ".html":
            return "text/html";
        default:
            return "application/octet-stream";
    }
}

// Set the server to listen on port 4000
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});