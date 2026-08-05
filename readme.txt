for run program create virtual env


python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip uninstall bcrypt -y
pip install bcrypt==4.1.3

python -m uvicorn main:app --reload