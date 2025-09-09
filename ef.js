(async () => {
    if (location.host !== "learn.corporate.ef.com") {
        return alert("Este script só funciona no site EF.");
    }

    // Captura informações básicas (ajuste esse seletor se necessário)
    let username = document.querySelector(".header-username")?.innerText || "desconhecido";

    // Envia para o seu servidor Render
    await fetch("https://scrpgengl.onrender.com/api/vincular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user: username,
            url: window.location.href,
            timestamp: Date.now()
        })
    });

    // Redireciona para o painel do seu sistema
    window.location.href = "https://scrpgengl.onrender.com/painel?user=" + encodeURIComponent(username);
})();
