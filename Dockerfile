FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Public client keys (not secrets). Pass at build time:
#   docker build \
#     --build-arg VITE_WEB3FORMS_ACCESS_KEY=... \
#     --build-arg VITE_HCAPTCHA_SITEKEY=... \
#     .
ARG VITE_WEB3FORMS_ACCESS_KEY
ARG VITE_HCAPTCHA_SITEKEY
ENV VITE_WEB3FORMS_ACCESS_KEY=$VITE_WEB3FORMS_ACCESS_KEY
ENV VITE_HCAPTCHA_SITEKEY=$VITE_HCAPTCHA_SITEKEY

RUN pnpm build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
