import cv2
import numpy as np
import os
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from PIL import Image
import io
import random

app = Flask(__name__)
CORS(app)

# cargar Clasificador de rostros
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
recognizer = cv2.face.LBPHFaceRecognizer_create()
MODELO_PATH = 'modelo_entrenado.yml'
LABEL_PATH = 'LABEL_PATH'
FOTO_DIR = '../backend/uploads/fotos/'

def cargar_modelo():
    if os.path.exists(MODELO_PATH) and os.path.exists(LABEL_PATH):
        recognizer.read(MODELO_PATH)
        with open(LABEL_PATH, 'rb') as f:
            label_dict = pickle.load(f)
        return True, label_dict
    return False, {}

def entrenar_modelo():
    faces = []
    labels = []
    label_dict = {}
    current_label = 0

    if not os.path.exists(FOTO_DIR):
        return False

    for filename in os.listdir(FOTO_DIR):
        if filename.endswith('.jpg') or filename.endswith('.png'):
            try:
                personal_id = int(filename.split('_')[0])
            except:
                continue

            img_path = os.path.join(FOTO_DIR, filename)
            img = cv2.imread(img_path)
            if img is None:
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces_rect = face_cascade.detectMultiScale(gray, 1.3, 5)

            for (x, y, w, h) in faces_rect:
                roi_gray = gray[y:y+h, x:x+w]
                faces.append(roi_gray)
                labels.append(current_label)

                if personal_id not in label_dict:
                    label_dict[personal_id] = current_label
                    current_label += 1

    if len(faces) > 0:
        recognizer.train(faces, np.array(labels))
        recognizer.save(MODELO_PATH)
        with open(LABEL_PATH, 'wb') as f:
            pickle.dump(label_dict, f)
        print(f"✅ Modelo entrenado con {len(faces)} rostros")
        return True
    return False

@app.route('/api/reconocer', methods=['POST'])
def reconocer():
    try:
        data = request.json
        img_data = base64.b64decode(data['image'].split(',')[1])
        img = Image.open(io.BytesIO(img_data))
        frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) > 0:
            (x, y, w, h) = faces[0]
            roi_gray = gray[y:y+h, x:x+w]

            if os.path.exists(MODELO_PATH) and os.path.exists(LABEL_PATH):
                recognizer.read(MODELO_PATH)
                with open(LABEL_PATH, 'rb') as f:
                    label_dict = pickle.load(f)

                print(f"LABEL_DICT CARGADO: {label_dict}")
                
                label, confidence = recognizer.predict(roi_gray)
                print(f"LABEL PREDECIDO: {label}, CONFIANZA: {confidence}")
                
                id_real = None
                for k, v in label_dict.items():
                    if v == label:
                        id_real = k
                        print(f"MATCH ENCONTRADO: ID={k}, LABEL={v}")
                        break
                
                print(f"ID REAL FINAL: {id_real}")

                if confidence < 100 and id_real is not None:
                    return jsonify({
                        'success': True,
                        'personal_id': id_real,
                        'confidence': float(confidence)
                    })
                else:
                    return jsonify({'success': False, 'message': f'No match: label={label}, id_real={id_real}'})
                
            return jsonify({'success': False, 'message': 'Modelo no entrenado'})
    
        return jsonify({'success': False, 'message': 'No se detecto ningun rostro'})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/capturar', methods=['POST'])
def capturar():
    try: 
        data = request.json
        img_data = base64.b64decode(data['image'].split(',')[1])
        personal_id = data['personal_id']

        img = Image.open(io.BytesIO(img_data))
        frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

        filename = f"{personal_id}_{random.randint(1000,9999)}.jpg"
        filepath = os.path.join(FOTO_DIR, filename)
        cv2.imwrite(filepath, frame)

        print("🔄 Reentrenando modelo....")
        entrenar_modelo()

        return jsonify({'success': True, 'filename': filename})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    
if __name__ == '__main__':
    print("🚀 Servicio de Reconocimiento Facial Python")
    print("📡 Puerto: 5000")
    
    if os.path.exists(FOTO_DIR) and len(os.listdir(FOTO_DIR)) > 0:
        print("🔄 Entrenando modelo inicial...")
        entrenar_modelo()
    else:
        print("⚠️ No hay fotos para entrenar")

    app.run(host='0.0.0.0', port=5000, debug=True)