const BASE_URL = "http://localhost:5000";
        let accounts = [];

        // Авторизація
        document.getElementById("login-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;

            try {
                const res = await fetch(`${BASE_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                alert(data.message);
                if (res.ok) {
                    document.getElementById("login-page").style.display = "none";
                    document.getElementById("crm-page").style.display = "block";
                    fetchAccounts();
                }
            } catch (err) {
                alert("Помилка з'єднання з сервером");
            }
        });

        // Завантаження акаунтів
        async function fetchAccounts() {
            const res = await fetch(`${BASE_URL}/accounts`);
            accounts = await res.json();
            renderAccounts();
        }

        // Відображення акаунтів
        function renderAccounts() {
            const table = document.getElementById('accountTable');
            table.innerHTML = '';
            accounts.forEach(acc => {
                const row = table.insertRow();
                row.insertCell(0).textContent = acc.email;
                row.insertCell(1).textContent = acc.steamLogin || 'Немає';  // Відображення Логіну Steam
                row.insertCell(2).textContent = acc.googlePassword;
                row.insertCell(3).textContent = acc.steamPassword;
                row.insertCell(4).textContent = acc.purchased ? 'Так' : 'Ні';

                const actionCell = row.insertCell(5);
                const btn = document.createElement('button');
                btn.textContent = acc.purchased ? 'Позначити як не куплено' : 'Позначити як куплено';
                btn.className = 'action-btn';
                btn.onclick = async () => {
                    await fetch(`${BASE_URL}/accounts/${acc._id}/toggle`, {
                        method: 'PUT'
                    });
                    fetchAccounts();
                };
                actionCell.appendChild(btn);
            });
        }

        // Додати акаунт
        async function addAccount() {
            const email = document.getElementById('email').value.trim();
            const steamLogin = document.getElementById('steamLogin').value.trim(); // Отримання Логіну Steam
            const googlePassword = document.getElementById('googlePassword').value.trim();
            const steamPassword = document.getElementById('steamPassword').value.trim();

            if (!email || !steamLogin || !googlePassword || !steamPassword) {
                alert("Заповніть всі поля!");
                return;
            }

            await fetch(`${BASE_URL}/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, steamLogin, googlePassword, steamPassword, purchased: false })
            });

            document.getElementById('email').value = '';
            document.getElementById('steamLogin').value = ''; // Очищення поля для Логіну Steam
            document.getElementById('googlePassword').value = '';
            document.getElementById('steamPassword').value = '';

            fetchAccounts();
        }