export const openApiHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mistral AI Question Service - API Documentation</title>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .swagger-ui .topbar {
            background-color: #2c3e50;
        }
        .swagger-ui .info .title {
            color: #2c3e50;
        }
        .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .custom-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 300;
        }
        .custom-header p {
            margin: 0.5rem 0 0 0;
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .swagger-container {
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>🚀 Mistral AI Question Service</h1>
        <p>Interactive API Documentation & Testing Interface</p>
    </div>
    
    <div class="swagger-container">
        <div id="swagger-ui"></div>
    </div>

    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                tryItOutEnabled: true,
                requestInterceptor: function(request) {
                    // Add any custom request headers here if needed
                    return request;
                },
                responseInterceptor: function(response) {
                    // Handle responses if needed
                    return response;
                }
            });
        };
    </script>
</body>
</html>
`;
