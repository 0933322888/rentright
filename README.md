# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

<!-- DOCUSIGN FLOW:-->
Get your DocuSign API credentials from the DocuSign Developer Portal
Generate a private key for JWT authentication
Set up webhook endpoints in your DocuSign account
The workflow will be:
Landlord approves an application
Landlord clicks "Send for Signing" in the Lease Agreement section
System generates the lease agreement PDF
DocuSign envelope is created and sent to both parties
Each party can sign the document through the embedded signing experience
Both parties can view the signed document after completion
The system tracks the signing status and updates the UI accordingly
