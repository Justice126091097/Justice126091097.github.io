const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders,
        },
    });
}

function supabaseHeaders(extra = {}) {
    return {
        'apikey': SUPABASE_SECRET_KEY,
        'Content-Type': 'application/json',
        ...extra,
    };
}

export default {
    async fetch(request) {
        // 处理浏览器的 CORS 预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        try {
            const url = new URL(request.url);

            // =========================
            // GET /api/articles
            // 获取全部文章
            // =========================
            if (request.method === 'GET') {
                const response = await fetch(
                    `${SUPABASE_URL}/rest/v1/articles?select=*&order=id.asc`,
                    {
                        method: 'GET',
                        headers: supabaseHeaders(),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error('Supabase GET 错误：', data);

                    return jsonResponse(
                        {
                            error: '读取文章失败',
                            details: data,
                        },
                        response.status
                    );
                }

                return jsonResponse(data);
            }

            // =========================
            // POST /api/articles
            // 新增文章
            // =========================
            if (request.method === 'POST') {
                const article = await request.json();

                const response = await fetch(
                    `${SUPABASE_URL}/rest/v1/articles`,
                    {
                        method: 'POST',
                        headers: supabaseHeaders({
                            'Prefer': 'return=representation',
                        }),
                        body: JSON.stringify({
                            title: article.title,
                            content: article.content,
                            date: article.date,
                        }),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error('Supabase POST 错误：', data);

                    return jsonResponse(
                        {
                            error: '保存文章失败',
                            details: data,
                        },
                        response.status
                    );
                }

                return jsonResponse(data[0], 201);
            }

            // PUT 和 DELETE 都需要文章 id
            const id = url.searchParams.get('id');

            if (!id) {
                return jsonResponse(
                    {
                        error: '缺少文章 id',
                    },
                    400
                );
            }

            // 确保 id 是整数
            const articleId = Number(id);

            if (!Number.isInteger(articleId)) {
                return jsonResponse(
                    {
                        error: '文章 id 必须是整数',
                    },
                    400
                );
            }

            // =========================
            // PUT /api/articles?id=1
            // 修改文章
            // =========================
            if (request.method === 'PUT') {
                const article = await request.json();

                const response = await fetch(
                    `${SUPABASE_URL}/rest/v1/articles?id=eq.${articleId}`,
                    {
                        method: 'PATCH',
                        headers: supabaseHeaders({
                            'Prefer': 'return=representation',
                        }),
                        body: JSON.stringify({
                            title: article.title,
                            content: article.content,
                        }),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error('Supabase PUT 错误：', data);

                    return jsonResponse(
                        {
                            error: '修改文章失败',
                            details: data,
                        },
                        response.status
                    );
                }

                if (data.length === 0) {
                    return jsonResponse(
                        {
                            error: '文章不存在',
                        },
                        404
                    );
                }

                return jsonResponse(data[0]);
            }

            // =========================
            // DELETE /api/articles?id=1
            // 删除文章
            // =========================
            if (request.method === 'DELETE') {
                const response = await fetch(
                    `${SUPABASE_URL}/rest/v1/articles?id=eq.${articleId}`,
                    {
                        method: 'DELETE',
                        headers: supabaseHeaders({
                            'Prefer': 'return=representation',
                        }),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error('Supabase DELETE 错误：', data);

                    return jsonResponse(
                        {
                            error: '删除文章失败',
                            details: data,
                        },
                        response.status
                    );
                }

                if (data.length === 0) {
                    return jsonResponse(
                        {
                            error: '文章不存在',
                        },
                        404
                    );
                }

                return jsonResponse({
                    message: '文章已删除',
                });
            }

            return jsonResponse(
                {
                    error: '不支持的请求方法',
                },
                405
            );

        } catch (error) {
            console.error('Vercel Function 错误：', error);

            return jsonResponse(
                {
                    error: '服务器内部错误',
                },
                500
            );
        }
    },
};