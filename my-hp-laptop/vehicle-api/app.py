from flask import Flask, jsonify, request

app = Flask(__name__)
sales = [
    {"id":1,"vehicle":"Toyota","price":20000},
    {"id":2,"vehicle":"Honda","price":22000}
]
@app.route("/sales/<int:sale_id>")
def get_sale(sale_id):

    for sale in sales:
        if sale["id"] == sale_id:
            return jsonify(sale)

    return jsonify({"error":"Sale not found"})
    
@app.route("/sales", methods=["GET"])
def get_sales():
    return jsonify(sales)

@app.route("/sales", methods=["POST"])
def add_sale():
    data = request.json
    sales.append(data)
    return jsonify({"message": "Sale added", "data": data})

@app.route("/")
def home():
    return "Vehicle API Running"

@app.route("/inspect")
def inspect():
    return jsonify({
        "method": request.method,
        "path": request.path,
        "client_ip": request.remote_addr,
        "user_agent": request.headers.get("User-Agent")
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)