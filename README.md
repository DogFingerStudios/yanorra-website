# Yanorra Website

A web-based interactive map and wiki for exploring the fictional world of Yanorra.


## Dev Env Setup

### Windows

Both Node.js and `npm` need to be installed. On Windows, I prefer to use _Fast Node Manager_, aka `fnm`. 

#### Install FNM

```ps
winget install Schniz.fnm
```

#### Activate FNM

* Now setup node environment:
```ps
fnm env --use-on-cd | Out-String | Invoke-Expression
```

* Download and Install Node.js
```ps
fnm use --install-if-missing 20
```

#### Setup Node

At this point the `node.exe` is installed, and so is the `npm` script. However, your system may not allow you to run `npm` if it is not configured to run scripts. To allow this do:

```ps
Set-ExecutionPolicy -ExecutionPolicy Unrestricted
```

#### Activate Node

Now node and npm should work: 

```bash
node -v # should print something like `v20.18.0`
npm -v  # should print something like `10.8.2`
```

## Running Website Locally

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### `npm run dev`

Runs the web browser

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
