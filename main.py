from datetime import datetime
from flask import Flask, jsonify, render_template, request
import mysql.connector

app = Flask(__name__)
db_name = 'school'

def get_db_connection():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="1122",
        database=db_name
    )
    return conn


@app.route('/')
def index():
    return render_template('table.html')


@app.route('/data/<table_name>', methods=['GET'])
def get_data(table_name):
    filters = request.args.get('filters')
    query = f'SELECT * FROM {table_name}'
    params = []

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Обработка фильтров
        if filters:
            filters = eval(filters)
            filter_clauses = []

            for filter in filters:
                column = filter['column']
                value = filter['value']
                search_type = filter['searchType']

                if search_type == 'LIKE':
                    filter_clauses.append(f"{column} LIKE %s")
                    params.append(f"%{value}%")
                else:
                    filter_clauses.append(f"{column} {search_type} %s")
                    params.append(value)

            if filter_clauses:
                query += " WHERE " + " AND ".join(filter_clauses)

        cursor.execute(query, params)
        data = cursor.fetchall()

        # Преобразование дат
        for row in data:
            for key, value in row.items():
                if isinstance(value, datetime):
                    row[key] = value.strftime('%d.%m.%Y')

        cursor.close()
        conn.close()
        return jsonify(data)
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400


@app.route('/params/<call_type>/<name>', methods=['GET'])
def get_params(call_type, name):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if call_type == 'procedure':
            query = """
            SELECT PARAMETER_NAME as param_name, DATA_TYPE as param_type
            FROM INFORMATION_SCHEMA.PARAMETERS
            WHERE SPECIFIC_NAME = %s AND ROUTINE_TYPE = 'PROCEDURE'
            """
        elif call_type == 'function':
            query = """
            SELECT PARAMETER_NAME as param_name, DATA_TYPE as param_type
            FROM INFORMATION_SCHEMA.PARAMETERS
            WHERE SPECIFIC_NAME = %s AND ROUTINE_TYPE = 'FUNCTION'
            """
        else:
            return jsonify({'error': 'Invalid call type'}), 400

        cursor.execute(query, (name,))
        params = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(params)
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400


@app.route('/call/<call_type>/<name>', methods=['POST'])
def call_db(call_type, name):
    try:
        data = request.json
        params = data.get('params', [])

        conn = get_db_connection()
        cursor = conn.cursor()

        if call_type == 'procedure':
            placeholders = ', '.join(['%s'] * len(params))
            query = f"CALL {name}({placeholders})"
            cursor.execute(query, params)
            conn.commit()
            results = {'message': 'Procedure executed successfully'}

        elif call_type == 'function':
            placeholders = ', '.join(['%s'] * len(params))
            query = f"SELECT {name}({placeholders})"
            cursor.execute(query, params)
            result = cursor.fetchone()
            results = {'result': result[0] if result else None}

        else:
            return jsonify({'error': 'Invalid call type'}), 400

        cursor.close()
        conn.close()

        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400


@app.route('/add/<table_name>', methods=['POST'])
def add_row(table_name):
    try:
        data = request.json
        # Безопасное удаление ID, если оно пустое или отсутствует
        if 'ID' in data and not data['ID']:
            del data['ID']

        columns = ', '.join(data.keys())
        placeholders = ', '.join(['%s'] * len(data))
        values = tuple(data.values())

        query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Row added successfully'}), 201
    except Exception as err:
        print(f"Detailed error: {err}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(err), 'details': traceback.format_exc()}), 400


@app.route('/delete/<table_name>/<id>', methods=['DELETE'])
def delete_row(table_name, id):
    try:
        query = f"DELETE FROM {table_name} WHERE id = %s"

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, (id,))
        conn.commit()
        cursor.close()
        conn.close()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Row not found'}), 404

        return jsonify({'message': 'Row deleted successfully'}), 200
    except mysql.connector.Error as err:
        print(err)
        return jsonify({'error': str(err)}), 400


@app.route('/edit/<table_name>')
def edit_page(table_name):
    return render_template('edit.html', table_name=table_name)


@app.route('/update/<table_name>/<id>', methods=['PUT'])
def update_row(table_name, id):
    try:
        data = request.json
        set_clause = ', '.join([f"{key} = %s" for key in data.keys()])
        values = list(data.values()) + [id]

        query = f"UPDATE {table_name} SET {set_clause} WHERE id = %s"
        # print(query)
        # print(values)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, values)
        conn.commit()

        cursor.close()
        conn.close()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Row not found'}), 404

        return jsonify({'message': 'Row updated successfully'}), 200
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400


@app.route('/tables', methods=['GET'])
def get_tables():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
        # print(tables)
        cursor.close()
        conn.close()
        return jsonify(tables), 200
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400


@app.route('/routines/<routine_type>', methods=['GET'])
def get_routines(routine_type):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if routine_type == 'procedure':
            routine_query = "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_SCHEMA = DATABASE()"
        elif routine_type == 'function':
            routine_query = "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'FUNCTION' AND ROUTINE_SCHEMA = DATABASE()"
        else:
            return jsonify({'error': 'Invalid routine type'}), 400

        cursor.execute(routine_query)
        routines = [row['ROUTINE_NAME'] for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(routines), 200
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400


@app.route('/get_columns/<table_name>', methods=['GET'])
def get_columns(table_name):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(f"SHOW COLUMNS FROM {table_name}")
        columns = [row[0] for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(columns)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
