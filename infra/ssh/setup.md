# Настройка SSH

1. Выполнить `ssh-copy-id -fi ./infra/ssh/id_rsa.pub <username>@<host>`
2. Подключиться к серверу через `ssh`
3. Раскомментировать строчку `PasswordAuthentication no` в `/etc/ssh/sshd_config`
4. Перезапустить `ssh`: `sudo systemctl restart ssh`