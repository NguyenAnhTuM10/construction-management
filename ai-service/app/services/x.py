import inspect
from xgboost import XGBRegressor



model = XGBRegressor()
print(inspect.getsource(model.fit))