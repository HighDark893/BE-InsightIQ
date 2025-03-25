import app from "./app";
import { env } from './config/app.config';



app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
});
