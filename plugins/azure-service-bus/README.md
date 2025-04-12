# Azure Service Bus Plugin

Welcome to the **Azure Service Bus** plugin! This plugin integrates Azure Service Bus functionalities into Backstage.

---

## 🚀 Getting Started

Your plugin has been added to the example app in this repository. You can access it by running:

```bash
yarn start
```

Then navigate to: [http://localhost:3000/azure-service-bus](http://localhost:3000/azure-service-bus).

For faster iteration during development, you can serve the plugin in isolation:

```bash
cd plugins/azure-service-bus
yarn start
```

> **Note:** This method is only for local development. The setup for it can be found inside the [/dev](./dev) directory.

---

## ✅ Prerequisites

Before running the plugin, ensure the following configurations are in place:

### 1. Environment Variables

Set the following environment variables in your `.env` file or environment:

- `AZURE_SERVICE_BUS_PIPELINE_URL`: The URL of the Azure Service Bus pipeline.
- `AZURE_TOKEN`: The token for authenticating with Azure.

### 2. Entity Annotations

Add the following annotations to your entities in the catalog:

- **Queues**: `azure-service-bus/queues`
  Example: `queue1,queue2,queue3`

- **Topics**: `azure-service-bus/topics`
  Example: `topic1,topic2,topic3`

### 3. Backend Configuration

Ensure the `app-config.yaml` file includes the following under `plugins`:

```yaml
plugins:
  azureServiceBus:
    pipelineUrl: ${AZURE_SERVICE_BUS_PIPELINE_URL}
    pipelineToken: ${AZURE_TOKEN}
```

---

## 📚 Features

- **Trigger Pipelines**: Start Azure Service Bus pipelines directly from Backstage.
- **View Logs**: Monitor build logs in real-time.
- **Manage Resources**: Handle queues and topics efficiently.

---

## 🛠️ Troubleshooting

### Missing Configuration

If you encounter the error:
`Configuração "plugins.azureServiceBus.pipelineUrl" ausente no app-config.yaml`
Ensure the `pipelineUrl` is correctly set in your `app-config.yaml`.

### Missing Annotations

If no queues or topics are displayed, verify that the required annotations (`azure-service-bus/queues` or `azure-service-bus/topics`) are added to your entity.
