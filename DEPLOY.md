# 🚀 Guia de Deploy - Loterias AI

Este guia explica como colocar seu sistema no ar usando **Render** (Backend) e **Vercel** (Frontend).

## 1. Preparação (GitHub)

Certifique-se de que todo o seu código está salvo no GitHub.

1. Crie um novo repositório no GitHub.
2. Envie seus código para lá.

## 2. Backend (Render.com)

O Backend é onde fica a inteligência e o banco de dados.

1. Crie uma conta em [render.com](https://render.com).
2. No painel, clique em **New +** e selecione **Blueprint**.
3. Conecte sua conta do GitHub e selecione o repositório do projeto.
4. O Render vai detectar automaticamente o arquivo `render.yaml` que eu criei.
5. Clique em **Apply** / **Create Resources**.
   - Ele vai criar o Servidor "loterias-backend".
   - Ele vai criar o Banco de Dados "loterias-db".
6. Aguarde o deploy finalizar (ficar verde/Live).
7. Copie a URL do seu backend (ex: `https://loterias-backend-xyz.onrender.com`) - você vai precisar dela para o Frontend!

## 3. Frontend (Vercel.com)

O Frontend é o site que as pessoas acessam.

1. Crie uma conta em [vercel.com](https://vercel.com).
2. Clique em **Add New...** -> **Project**.
3. Selecione o mesmo repositório do GitHub.
4. A Vercel vai detectar que é um projeto **Vite**.
5. **Configuração Importante**:
   - Procure a seção **Environment Variables**.
   - Adicione uma nova variável:
     - **Nome**: `VITE_API_URL`
     - **Valor**: (A URL do seu backend que você copiou no passo anterior)
6. Clique em **Deploy**.

## 🚀 Conclusão

Assim que a Vercel terminar, você receberá um link (ex: `loterias-ai.vercel.app`). Esse é o endereço do seu site funcionando na internet!

---

**Nota**: Se precisar importar dados no ambiente de produção, você pode usar os mesmos comandos de "Importação" (botões ou API) apontando para o endereço do seu novo site.
