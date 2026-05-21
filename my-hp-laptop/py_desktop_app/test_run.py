import tkinter as tk

def smoke_test():
    root = tk.Tk()
    root.withdraw()
    print("tkinter OK")
    root.destroy()

if __name__ == "__main__":
    smoke_test()
