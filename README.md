This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/import?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


## Experiment results

### To deploy the infrastructure

You need to have environment variables in your terminal session

```
export AWS_ACCESS_KEY_ID=YOUR_KEY
export AWS_SECRET_ACCESS_KEY=YOUR_KEY
````

- Go to the project root
- Run `terraform init` (only the first time needed)
- Run `terraform plan`
- Run `terraform apply`

Note: First deployments may give errors about S3 ACLs not being enabled. You can enable them manually in AWS console and then run `terraform apply` again.
Terraform will continue deployment from the state it stopped.

### To Build the app

- Create .env file with following variables
```
    CF_HOST = cdn.contentful.com
    CF_ACCESS_TOKEN = ...
    CF_ENV = development
    CF_SPACE = sqrqcp8t956w
```
- Run npm install
- Run `npm run tf-next`

### To deploy the app after the build

- Run `terraform plan` (optional)
- Run `terraform apply`

## Conclusions

- This experiment uses latest LTS of the module `https://github.com/milliHQ/terraform-aws-next-js` (version 0.13.2). It works fine with `react@17.0.2 react-dom@17.0.2`.
- ISR POC has been created with an example of the url `/compliance`. In order to check it you will need to deploy the insfrastructire and the app. Then you will get the cloudfront url as a command result.
    Then you can just open the url e.g. `https://d1wrukqhxy8f5w.cloudfront.net/de/compliance`. To check ISR regeneration you can go to CF dev environment and change for example internal name of compliance LP. Make sure 60 seconds are passed after you opened the page and the reload the page and you should see you changes.

## Problems

- Terraform deploys infrastructure code among the app deployment as well. Ideally they should go separately
- This version of th emodule is not compatible with latest react and nextjs. It's ok with react@17.0.2 and nextjs@10.4
- ISR regeneration fails on the url `https://d1wrukqhxy8f5w.cloudfront.net/de/newsletter` with the status of 413 (see logs in CloudWatch).
  The problem is that our json after contentful import for this page newsletter weights >1mb. And there is a hard limit of Lambda function payload size.
  We need to investigate why json is so big.
- ISR regeneration is visible on the UI by delaying of rendering. The reason is that this module uses AWs API Gateway which has a direct trigger to lambda. That means Lambda works synchronously 
  and it shows the delaying. We need to investigate if there is a way of overcome this by header `stale-while-invalidate` or some APi gateway integration setups

## Good things

- Easy to deploy the infrastructure, no additional hassle.
- Easy to pack and application and deploy
- Easy to test ISR with this version just because it works


Please check this url from POC.

`https://d1wrukqhxy8f5w.cloudfront.net/de/compliance` - Working ISR in AWS
`https://d1wrukqhxy8f5w.cloudfront.net/de/newsletter` - Failing in AWS