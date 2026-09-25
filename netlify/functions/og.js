const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    // 1. URL에서 글 번호(id) 가져오기 (예: /api/og?id=1 또는 _redirects를 통한 /post/1)
    const id = event.queryStringParameters.id;
    
    // 기본값 설정 (id가 없거나 잘못되었을 때)
    let title = "사이트 기본 제목";
    let description = "사이트 기본 설명 문구";
    let image = "https://여러분의도메인주소.netlify.app/images/default-logo.png"; // 기본 로고 이미지 절대경로
    let host = event.headers.host || "여러분의도메인주소.netlify.app";

    if (id) {
        try {
            // 2. articles 폴더 안에서 해당 id에 맞는 JSON 파일 읽기 (예: articles/1.json)
            // __dirname 기준 상위로 두 번 올라가서 articles 폴더로 접근
            const jsonPath = path.resolve(__dirname, `../../articles/${id}.json`);
            
            if (fs.existsSync(jsonPath)) {
                const jsonData = fs.readFileSync(jsonPath, 'utf-8');
                const targetItem = JSON.parse(jsonData);

                // JSON 내부 키 이름(title, content, image 등)에 맞춰 수정하세요
                title = targetItem.title || title;
                description = targetItem.content ? targetItem.content.substring(0, 100) : description;
                image = targetItem.image || image;
            }
        } catch (error) {
            console.error(`JSON 파일 로딩 에러 (id: ${id}):`, error);
        }
    }

    // 3. 카카오톡 크롤러에게 보여줄 동적 HTML 반환
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        
        <!-- 카카오톡/페이스북 등 오픈그래프(OG) 메타 태그 -->
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${image}">
        <meta property="og:url" content="https://${host}/post/${id || ''}">
        
        <!-- 일반 사용자가 접속했을 때 실제 본문 페이지(예: detail.html 또는 index.html)로 이동시키기 -->
        <meta http-equiv="refresh" content="0;url=/detail.html?id=${id}">
    </head>
    <body>
        <p>게시글을 불러오는 중입니다...</p>
    </body>
    </html>
    `;

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
        },
        body: html,
    };
};
