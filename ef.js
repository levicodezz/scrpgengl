(async () => {
    if (location.host !== "learn.corporate.ef.com") {
        return alert("Este script só funciona no EF.");
    }

    // Captura algumas infos do usuário (ajustar depois com base no DOM real)
    let username = document.querySelector(".header-username")?.innerText || "desconhecido";

    // Envia para nosso servidor
    await fetch("https://SEU_DOMINIO/api/vincular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user: username,
            url: window.location.href,
            timestamp: Date.now()
        })
    });

    // Redireciona para painel
    window.location.href = "https://SEU_DOMINIO/painel?user=" + encodeURIComponent(username);
})();
