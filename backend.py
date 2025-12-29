import pandas as pd
import numpy as np
import io, base64, uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import matplotlib.pyplot as plt

app = FastAPI(title="VoltGuard AI Engine")

# تفعيل CORS لربط React مع FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

data = pd.read_csv("PowerQualityDistribution.csv", sep=';')

try:
    data = pd.read_csv(FILE_PATH, sep=';')
    X = data.drop("output", axis=1)
    y = data["output"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    print("✅ Model Trained Successfully!")
except Exception as e:
    print(f"❌ Error: {e}. Please check your CSV path.")


class ArrayInputModel(BaseModel):
    data: List[float] = Field(..., min_items=128, max_items=128)


def process_results(features):
    input_df = pd.DataFrame([features], columns=[f"Col{i + 1}" for i in range(128)])
    prediction_code = int(model.predict(input_df)[0])
    confidence = float(max(model.predict_proba(input_df)[0]))

    messages = {1: "Normal", 2: "3rd Harmonic", 3: "5th Harmonic", 4: "Voltage Dip", 5: "Transient"}
    res_text = messages.get(prediction_code, "Distorted")

    # توليد صورة الموجة
    plt.figure(figsize=(8, 3))
    plt.plot(features, color='#f0a500', linewidth=2)
    plt.fill_between(range(128), features, color='#f0a500', alpha=0.1)
    plt.axis('off')
    buf = io.BytesIO()
    plt.savefig(buf, format='png', transparent=True, bbox_inches='tight')
    plt.close()
    img_str = base64.b64encode(buf.getvalue()).decode()

    return res_text, confidence, img_str


@app.post("/predict")
async def predict(payload: ArrayInputModel):
    res_text, conf, img = process_results(payload.data)
    return {"class": res_text, "confidence": conf, "waveform_img": img}


@app.get("/generate_test")
async def generate_test():
    t = np.linspace(0, 1, 128)
    # موجة جيبية عشوائية للاختبار
    raw_data = (np.sin(2 * np.pi * 50 * t) + np.random.normal(0, 0.1, 128)).tolist()
    res_text, conf, img = process_results(raw_data)
    return {"class": res_text, "confidence": conf, "waveform_img": img, "raw_data": raw_data}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)