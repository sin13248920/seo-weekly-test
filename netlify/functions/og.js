const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
    // 1. URL에서 글 번호(id) 가져오기 (예: /api/og?id=1)
    const id = event.queryStringParameters.id;
    
    // 기본값 설정 (id가 없을 때)
    let title = "내 사이트 제목";
    let description = "내 사이트 설명";
    let image = "https://기본로고주소.png";
    let url = event.headers.host;

    try {
        // 2. JSON 파일 읽어오기 (경로는 프로젝트 구조에 맞게 수정 필요)
        const jsonPath = path.resolve(__dirname, '../../data.json'); 
        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const items = JSON.parse(jsonData);

        // 3. 요청된 id와 일치하는 데이터 찾기
        const targetItem = items.find(item => item.id == id); // json의 key 이름이 id가 아니라면 수정하세요 (예: item.no)

        if (targetItem) {
            title = targetItem.title;
            description = targetItem.content ? targetItem.content.substring(0, 100) : description; // 내용 앞부분 100자
            image = targetItem.image || image;
        }
    } catch (error) {
        console.error("JSON 로딩 에러:", error);
    }

    // 4. 카카오톡 크롤러에게 보여줄 동적 HTML 반환
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <!-- 카카오톡/페이스북 등 오픈그래프(OG) 태그 -->
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${image}">
        <meta property="og:url" content="https://${url}">
        
        <!-- 일반 사용자가 접속했을 때 원래 웹사이트(index.html)로 튕겨주기 위한 리다이렉트 -->
        <meta http-equiv="refresh" content="0;url=/index.html?id=${id}">
    </head>
    <body>
        <p>페이지를 이동 중입니다...</p>
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
