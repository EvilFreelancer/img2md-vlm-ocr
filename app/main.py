from fastapi import FastAPI
from app.controllers.objects_controller import router as objects_router

app = FastAPI()

app.include_router(objects_router)
 