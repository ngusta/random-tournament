This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Install dependencies

Install npm (Node.js + npm https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#os-x-or-windows-node-installers)

- npm install --save react-scripts
- npm install --save local-storage
- npm install --save react-router-dom  
- npm install --save i18next
- npm install --save react-i18next
- npm install --save gapi-script
- npm install --save dateformat
- npm install --save react-collapsible

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

There are not tests...

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run deploy`

Run this to deploy to AWS.

Prereq: 
- Install AWS CLI first (CLI 2 is fine)
- Run ``aws configure``
- Use Private AWS Access Credentials from 1Password as Access Key ID and passowrd
- Use eu-north-1 as default region
- Use json as default output

Now the deploy command should work!
After deployment, to see the results right away on ngusta.com
- Go to AWS CloudFront (https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=eu-north-1#/distributions/ETQT8NOF6TB09) 
- Create an invalidation (Invalidation tab) for /* 
- Run it

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
