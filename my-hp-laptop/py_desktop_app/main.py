import tkinter as tk
from tkinter import messagebox


def on_click():
    messagebox.showinfo("Hello", "Hello from Tkinter!")


def main():
    root = tk.Tk()
    root.title("Minimal Tkinter App")
    root.geometry("400x200")

    frm = tk.Frame(root, padx=20, pady=20)
    frm.pack(expand=True)

    btn = tk.Button(frm, text="Say Hello", command=on_click)
    btn.pack()

    root.mainloop()


if __name__ == "__main__":
    main()
