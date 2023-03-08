import numpy as np
from datetime import datetime
from flask import Flask, render_template
import json


def three_js_frame(array, scaler=1.0, threejs_rot=np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]])):
    """
    takes in column x,y,z np array and applies the threejs_rot rotation matrix to each row
    func([ 1, 2, 3]) --> [ 1,  3, -2]
    """
    if len(array.shape) == 1:
        array = np.array([array])
        return (scaler * np.einsum("ij,kj->ik", array, threejs_rot)[0]).tolist()
    else:
        return (scaler * np.einsum("ij,kj->ik", array, threejs_rot)).tolist()


km_to_threejs_ratio = .1 / 6371  # [(threejs radius)/(earth radius km)]
data = {'sun data': three_js_frame(np.array([0, -149600000, 0]), km_to_threejs_ratio),
        'moon data': three_js_frame(np.array([0, 0, 382500/25]), km_to_threejs_ratio),
        'utc time': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html", python_data=json.dumps(data))


if __name__ == "__main__":
    app.run()
