# ---- build: Expo web static export ----
FROM node:20-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# آدرسِ API در زمانِ build درون‌ریزی می‌شود؛ با --build-arg قابلِ تغییر است.
ARG EXPO_PUBLIC_API_BASE_URL=https://nodoost-bakcend.darkube.ir
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}
# خروجیِ استاتیکِ وب در ./dist تولید می‌شود (app.json: web.output = static)
RUN npx expo export -p web

# ---- serve: nginx با fallback به SPA ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
