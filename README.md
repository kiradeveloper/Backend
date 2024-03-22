# Losa API Typescript + ESLint

A brief description of the project and its purpose, including any relevant background information.

## Getting Started

1. Install the dependencies for the project by running the following command:
```bash
npm install
# or
yarn
```

2. Edit the configuration options in the `next.config.js` file as needed. The available options are described in the `Configuration` section below.

3. Follow the additional instructions in the `Getting Started` section to build and run the project.

4. Run the file with command : 
```bash
npm run dev
# or
yarn dev
```

## Configuration

The configuration options for the project are defined in the `next.config.js` file. The following is a description of the available options:

- `reactStrictMode`: a boolean value that determines whether React's strict mode is enabled. It should be set to `false` in production mode.

- `env`: an object containing environment variables that are used by the project. The properties of the object include:
  - `DB_USERNAME`: the username for the database.
  - `DB_PASSWORD`: the password for the database.
  - `DB_NAME`: the name of the database.
  - `DB_HOST`: the hostname or IP address of the database.
  - `DB_PORT`: the port number of the database.
  - `USE_BCRYPT`: a boolean value that determines whether password hash with bcrypt is used.
  - `USE_AUTH_TOKEN`: a boolean value that determines whether auth token is used.

To modify the configuration options, edit the values of the corresponding properties in the `nextConfig` object in the `next.config.js` file.

## Dependencies

A list of any dependencies that are required for the project, including libraries, frameworks, and tools.

## Contributions

Instructions on how to contribute to the project, including guidelines for submitting pull requests.

## License

The project is released under the MIT License. A copy of the license is provided in the `LICENSE` file, or you can view the full text of the license at https://opensource.org/licenses/MIT.
