# -*- coding: utf-8 -*-
from flask import Flask, request, render_template, jsonify
import json
import csv

app = Flask(__name__)

@app.route("/")
def index():
	return render_template("index.html")

@app.route("/checkins/", methods=['GET'])
def checkins():
	saida = []
	classe = {"0": "geral", "1": "turista", "2": "residente"}
	cidade = {"0": "geral", "1": "newyork", "2": "rio", "3": "london", "4": "tokyo"}

	id_classe = request.args.get("classe", "0")
	id_cidade = request.args.get("cidade", "0")

	if id_cidade == "0" and id_classe != "0":#todas as cidades e turistas/residentes

		for codigo_cidade, nome_cidade in cidade.items():

			if codigo_cidade != "0":
				arquivo = open("static/json/merge_json_" + nome_cidade + "_" + classe.get(id_classe) + ".txt")

				for linha in arquivo:
					saida.append(json.loads(linha))
	else:
		arquivo = open("static/json/merge_json_" + cidade.get(id_cidade) + "_" + classe.get(id_classe) + ".txt")

		for linha in arquivo:
			saida.append(json.loads(linha))

	return jsonify(items=saida)

@app.errorhandler(404)
def page_not_found(e):
	return "Esta URL não existe o.O", 404

@app.errorhandler(500)
def application_error(e):
	return "Erro inesperado. Deve ter sido o programador antigo...".format(e), 500

if __name__ == "__main__":
	app.run()
