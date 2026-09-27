export default {
    async fetch(request, env) {
        return new Response('零食经线后端已经上线！', {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            }
        });
    }
};