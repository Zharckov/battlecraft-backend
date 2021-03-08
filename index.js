const express   = require('express');
const http      = require('http');
const bodyParse = require('body-parser');
const cors      = require('cors');
const helmet    = require('helmet');
const moment    = require('moment');
const config    = require('./config.json');
const path      = require('path');

const app       = express();
const server    = http.createServer(app);

// Models
const User          = require('./database/models/User');
const Temp2fa       = require('./database/models/Temp2fa');
const News          = require('./database/models/News');
const Donate        = require('./database/models/Donate');
const Streams       = require('./database/models/Streams');

// Routes
const AuthRoute     = require('./routes/authorization');
const UserRoute     = require('./routes/user');
const NewsRoute     = require('./routes/news');
const ManageRoute   = require('./routes/manage');
const DonateRoute   = require('./routes/donate');
const StreamsRoute  = require('./routes/streams');
const ShopRoute     = require('./routes/shop');

// Middlewares
const parseToken    = require('./middlewares/parseToken');
const ifNotAuthed   = require('./middlewares/ifNotAuthed');
const ifAuthed      = require('./middlewares/ifAuthed');
const isManager     = require('./middlewares/isManager');
const logger        = require('./middlewares/logger');

// Utils
const { getDataForClient }  = require('./utils/servers');

// Settings
moment.locale('ru');

// Use middlewares
app.use(helmet());
app.use(cors());
app.use(bodyParse.urlencoded({extended: true}));
app.use(bodyParse.json({ strict: true }));
app.use(parseToken);
app.use(logger);

// Use Routes
app.all('/', (req, res) => res.json({ date: moment().format("HH:mm:ss, DD.MM.YYYY a"), desc: "Возникли проблемы? Обратитесь к разработчику API", developer: "https://vk.com/id171745503" }));
app.get('/images', express.static(path.resolve(__dirname, 'images')));
app.get('/skins', express.static(path.resolve(__dirname, 'skins')));
app.get('/servers', getDataForClient);
app.use('/auth', AuthRoute);
app.use('/news', NewsRoute);
app.use('/donate', DonateRoute);
app.use('/streams', StreamsRoute);
app.use('/shop', ShopRoute);
app.use('/user', ifAuthed, UserRoute);
app.use('/manage', ifAuthed, isManager(), ManageRoute);
app.use((req, res) => res.status(404).json({ message: 'Route not found'}));

// API - Server start
server.listen(config.server.port, async () => {
    console.log(`API - Server > listen > ::${config.server.port}`);
    try {
        await User.sync({ alter: true, logging: false });
        console.log(`Users sync successful`);
        await Temp2fa.sync({ alter: true });
        console.log(`Temp2fa sync successful`);
        await Donate.sync({ alter: true });
        console.log(`Donate sync successful`);
        await News.sync({ alter: true });
        console.log(`News sync successful`);
        await Streams.sync();
        console.log(`Streams sync successful`);
    } catch (error) {
        console.log(`[Model Sync] -> Error -> ${error.message}\n${error.stack}`);
    }
});