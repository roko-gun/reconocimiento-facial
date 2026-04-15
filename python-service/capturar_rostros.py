import cv2
import os

#configuracion
FOTO_DIR = '../backend/uploads/fotos/'
face_cascade = cv2.CascadeClassifier('haarcascade.xml')

def capturar_rostros(personal_id, nombre):
    """Captura multiples fotos de un personal"""

    #Crear carpeta si no existe
    if not os.path.exists(FOTO_DIR):
        os.makedirs(FOTO_DIR)

    # Iniciar camara
    cap = cv2.VideoCapture(0)

    print(f"📷 Capturando rostros para: {nombre} (ID: {personal_id})")
    print("Presiona ESPACIO para capturar, ESC para salir")

    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            roi_gray = gray[y:y+h, x:x+w]

        cv2.imshow('Captura de Rostros', frame)

        key = cv2.waitKey(1)
        if key == 32: #espacio
            if len(faces) > 0:
                filename = f"{personal_id}_{count}.jpg"
                filepath = os.path.join(FOTO_DIR, filename)
                cv2.imwrite(filepath, roi_gray)
                print(f"✅ Foto {count} guardada: {filename}")
                count += 1 
        elif key == 27: #esc
            break
        
    cap.release()
    cv2.destroyAllWindows()
    print(f"📷 Captura completada. {count} fotos guardadas.")

if __name__ == '__main__':
    #ejemplo de uso
    id_personal = input("ID del personal: ")
    nombre = input("Nombtre del personal")
    capturar_rostros(int(id_personal), nombre)
