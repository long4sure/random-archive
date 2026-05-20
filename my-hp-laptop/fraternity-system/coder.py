
print("Create Account")

fname = input("First Name: ")
lname = input("Last Name: ")
gender = input("Gender: ")
age = input("Age: ")
birthdate = input("Birthdate: ")
username = fname + lname

print(f"Your username is {username}.")

password = input("Enter password: ")

login = input("Login? Y/N - ")

if login == "Y":
    username_acc = input("Enter username: ")
    password_acc = input("Please enter your password: ")
    if username_acc == username and password_acc == password:
        print(f"Welcome {fname} {lname}")
    else:
        print("Invalid username or password")
elif login == "N":
    print("Thank you")
else:
    print("Invalid option")