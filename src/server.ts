import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors, { CorsOptions } from 'cors';
import { IRequestSlice, IBody, ReviewId, ILike, IRegisterUser, IResponseDB, IResponseRegister, IReview } from './types/data-contracts';
import { sqlRequest } from './db/requests-db';
import helmet from 'helmet';
import { checkJwt } from './utils/checkJwt';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 5000; // 8080
const urlencodedParser = express.urlencoded({ extended: false });

const corsOptions: CorsOptions = {
	credentials: true,
	optionsSuccessStatus: 200,
	origin: ['http://localhost:3000'],
	methods: ['GET', 'POST', 'DELETE'],
}

app.use(helmet());
app.use(cors(corsOptions));

app.use(express.static("public"));

app.use(bodyParser.json());


app.post("/reviews", urlencodedParser, async (req: IBody<IRequestSlice>, res: Response<IReview[]>) => {
	const r = await sqlRequest<IReview>(
		`SELECT * FROM Reviews WHERE id>=${req.body.skip} AND id<${req.body.skip + req.body.take};`
	);
	if (r.error) {
		res.sendStatus(501)
	} else {
		res.setHeader("Content-Type", "application/json").status(200).json(r.body);
	}
})

app.post("/registerUser", urlencodedParser, async (req: IBody<IRegisterUser>, res: Response<IResponseDB<IResponseRegister>>) => {
	const user = req.body;
	await sqlRequest(
		`SELECT count(id) as count FROM users WHERE sub='${user.sub}';`
	).then(async (r) => {
		if (r.body[0].count === '0') {
			await sqlRequest(
				`INSERT INTO Users(first_name, last_name, sub)
				VALUES('${user?.firstName}', '${user?.lastName}', '${user?.sub}');`
			).then(async () => {
				await sqlRequest(
					`SELECT count(id) as result FROM users WHERE sub='${user.sub}';`
				).then(q => {
					res.setHeader("Content-Type", "application/json")
						.status(200)
						.json({ body: [{ isRegistered: q.body[0].result === '1' && true, isExist: true}], error: false })
				})
			})
		} else if (r.body[0].count !== '0') {
			res.setHeader("Content-Type", "application/json").status(200).json({ body: [{ isRegistered: false, isExist: true }], error: false })
		}
	});
})


// if (r.error) {
// 	res.sendStatus(501)
// } else {
// 	res.setHeader("Content-Type", "application/json").status(200).json(r.body);
//  }
// `INSERT INTO Users (first_name, last_name, sub) 
// VALUES (${user.firstName}, ${user.lastName}, ${user.sub});`

app.post('/likeReview', checkJwt, async (req: IBody<ILike>, res) => {
	// const r = req.body;
	// console.log(r)

	res.status(200).json({ message: req.body })
})

app.use('*', (req, res) => {
	res.status(400).json({ message: 'Only api endpoint available' })
})

app.listen(port, () => {
	console.log(`⚡️[server]: Server is running at https://localhost:${port} 🚀`);
});