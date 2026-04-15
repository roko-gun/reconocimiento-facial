import cv2
import numpy as np
import os
import pickle

# configuracion
FOTO_DIR = '../backend/uploads/fotos/'
MODELO_PATH = 'modelo_entrenado.yml'
LABEL_PATH = 'label_dict.pickle'

def entrenar_modelo():
    faces = []
    labels = []
    label_dict = {}
    current_label = 0

    print("📷 Entrenando modelo de reconocimiento facial...")

    # Verificar si hay fotos
    if not os.path.exists(FOTO_DIR):
        print(f"❌ La carpeta {FOTO_DIR} no existe")
        return False
    
    archivos = os.listdir(FOTO_DIR)
    if len(archivos) == 0:
        print("❌ No hay fotos en la carpeta")
        return False
    
    # cargar clasificador de rostros
    face_cascade = cv2.CascadeClassifier('haarcascade.xml')

    for filename in archivos:
        if filename.endswith('.jpg') or filename.endswith('.png'):
            #Extraer ID del personal 
            try:
                personal_id = int(filename.split('_')[0])
            except:
                continue

            # Leer imagen
            img_path = os.path.join(FOTO_DIR, filename)
            img = cv2.imread(img_path)
            if img is None:
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            #detectar rostro
            faces_rect = face_cascade.detectMultiScale(gray, 1.3, 5)

            for (x, y, w, h) in faces_rect:
                roi_gray = gray[y:y+h, x:x+w]
                faces.append(roi_gray)
                labels.append(personal_id)

                if personal_id not in label_dict:
                    label_dict[personal_id] = current_label
                    current_label += 1

    if len(faces) > 0:
        #Entrenar Modelo LBPH
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.train(faces, np.array(labels))

        #Guardar modelo
        recognizer.save(MODELO_PATH)

        # Guardar diciionario etiquetas
        with open(LABEL_PATH, 'wb') as f:
            pickle.dump(label_dict, f)

        print(f"✅ Modelo entrenado con {len(faces)} rostros")
        print(f"📋 Personal entrenado: {list(label_dict.keys())}")
        return True
    else:
        print("❌ No se encontraron rostros en las fotos")
        return False

if __name__=='__main__':
    entrenar_modelo()

