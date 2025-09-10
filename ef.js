(async () => {
  try {
    const username = document.querySelector('.header-username')?.innerText || 'desconhecido';

    // Exibe mensagem só para teste
    alert(`Usuário identificado: ${username}`);

    // Faz POST para API de vinculação (opcional)
    await fetch("https://scrpgengl.onrender.com/api/vincular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });

    // Redireciona para painel (ajuste conforme sua lógica)
    window.location.href = `https://scrpgengl.onrender.com/painel?user=${encodeURIComponent(username)}`;
  } catch (err) {
    console.error("Erro ao executar script remoto:", err);
    alert("❌ Falha ao executar script.");
  }
})();
