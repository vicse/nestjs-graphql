<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# Dev
1. Clonar el proyecto
2. Copiar el ```.env.template``` y renombrar a ```.env```
3. Ejecutar
```
yarn install
```
4. Levantar la imagen (Docker Desktop) 
```
docker compose up -d
```
5. Levantar el backend de Nest
```
yarn start:dev
```

6. Abrir en el navegador
```
localhost:3000/graphql
```

7. Ejecutar la __"mutation"__ executeSeed, para llenar la base de datos con información de prueba