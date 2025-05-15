# 🏗️ CycleBuddy System Architecture

This document provides a comprehensive overview of CycleBuddy's system architecture, showing how different components interact to create a secure, private, and user-friendly menstrual health tracking application on the Stellar blockchain.

## System Overview

```mermaid
graph TB
    User(User) --> FrontEnd[Frontend Application]
    FrontEnd --> Services[Service Layer]
    Services --> Contracts[Stellar Smart Contracts]
    Services --> Storage[Encrypted Storage]
    Storage --> IPFS[IPFS]
    Storage --> Stellar[Stellar Blockchain]
    Contracts --> Stellar
    
    subgraph "User Experience Layer"
        FrontEnd --> UI[UI Components]
        FrontEnd --> State[State Management]
        FrontEnd --> Auth[Authentication]
    end
    
    subgraph "Business Logic Layer"
        Services --> ContractService[Contract Service]
        Services --> AuthService[Auth Service]
        Services --> DataService[Data Service]
    end
    
    subgraph "Blockchain Layer"
        Contracts --> Registry[Registry Contract]
        Contracts --> Authentication[Auth Contract]
        Contracts --> DataStorage[Data Contract]
        Contracts --> Features[Feature Contracts]
    end
    
    subgraph "Feature Contracts"
        Features --> AIContract[AI Health Insights]
        Features --> NFTContract[NFT Education]
        Features --> ResearchContract[Research Marketplace]
        Features --> DonationContract[Donation]
        Features --> SharingContract[Data Sharing]
        Features --> RewardsContract[Rewards]
    end
    
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style FrontEnd fill:#bbf,stroke:#333,stroke-width:2px
    style Services fill:#bfb,stroke:#333,stroke-width:2px
    style Contracts fill:#fbb,stroke:#333,stroke-width:2px
    style Storage fill:#ffb,stroke:#333,stroke-width:2px
    style Stellar fill:#bff,stroke:#333,stroke-width:2px
```

## Technical Stack

CycleBuddy leverages modern technologies to create a secure, scalable, and user-friendly application:

```mermaid
flowchart LR
    subgraph "Frontend"
        React[React.js]
        TypeScript[TypeScript]
        Chakra[Chakra UI]
        Vite[Vite]
    end
    
    subgraph "Services"
        Freighter[Freighter Integration]
        SorobanSDK[Soroban SDK]
        IPFS[IPFS Client]
    end
    
    subgraph "Backend"
        Soroban[Soroban Smart Contracts]
        Rust[Rust]
        Stellar[Stellar Network]
        Turrets[Stellar Turrets]
    end
    
    React --> TypeScript
    TypeScript --> Chakra
    Chakra --> Vite
    
    Vite --> Freighter
    Freighter --> SorobanSDK
    SorobanSDK --> IPFS
    
    IPFS --> Soroban
    SorobanSDK --> Soroban
    Soroban --> Rust
    Rust --> Stellar
    Stellar --> Turrets
```

## Data Flow Architecture

This diagram illustrates how data flows through the system, highlighting the security measures at each stage:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Service
    participant Contracts
    participant Stellar
    participant IPFS
    
    User->>Frontend: Enter health data
    Frontend->>Frontend: Encrypt data locally
    Frontend->>Service: Send encrypted data
    Service->>Contracts: Store data hash & metadata
    Service->>IPFS: Store encrypted data
    IPFS-->>Service: Return IPFS hash
    Service->>Contracts: Link IPFS hash to user
    Contracts->>Stellar: Record transaction
    Stellar-->>Contracts: Confirm transaction
    Contracts-->>Service: Return success
    Service-->>Frontend: Confirm storage
    Frontend-->>User: Show success message
    
    User->>Frontend: Request data
    Frontend->>Service: Request user data
    Service->>Contracts: Query user data references
    Contracts-->>Service: Return data references
    Service->>IPFS: Fetch encrypted data
    IPFS-->>Service: Return encrypted data
    Service-->>Frontend: Return encrypted data
    Frontend->>Frontend: Decrypt data locally
    Frontend-->>User: Display data
```

## Authentication Flow

CycleBuddy uses Stellar Passkeys for secure, decentralized authentication:

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Freighter
    participant AuthService
    participant AuthContract
    participant Stellar
    
    User->>App: Initiate login
    App->>AuthService: Request authentication challenge
    AuthService->>AuthContract: Generate challenge nonce
    AuthContract-->>AuthService: Return challenge nonce
    AuthService-->>App: Return challenge
    App->>Freighter: Request signature
    Freighter->>User: Request approval
    User->>Freighter: Approve signing
    Freighter-->>App: Return signature
    App->>AuthService: Submit signature
    AuthService->>AuthContract: Verify signature
    AuthContract->>Stellar: Validate on blockchain
    Stellar-->>AuthContract: Confirm validity
    AuthContract-->>AuthService: Authentication result
    AuthService-->>App: Authentication token
    App-->>User: Access granted
```

## Contract Architecture

The smart contract architecture employs a registry pattern for upgradability and modular design:

```mermaid
graph TD
    Registry[Registry Contract] --> Auth[Auth Contract]
    Registry --> Data[Data Contract]
    Registry --> Community[Community Contract]
    Registry --> Features[Feature Contracts]
    
    subgraph "Core Contracts"
        Auth
        Data
        Community
    end
    
    subgraph "Feature Contracts"
        Features --> AI[AI Health Insights]
        Features --> NFT[NFT Education]
        Features --> Research[Research Marketplace]
        Features --> Donation[Donation]
        Features --> DataSharing[Data Sharing]
        Features --> Rewards[Rewards]
        Features --> ZKValidation[ZK Validation]
        Features --> DataMarketplace[Data Marketplace]
        Features --> HealthAlerts[Health Alerts]
    end
    
    style Registry fill:#f99,stroke:#333,stroke-width:2px
    style Auth fill:#9f9,stroke:#333,stroke-width:2px
    style Data fill:#99f,stroke:#333,stroke-width:2px
    style Community fill:#ff9,stroke:#333,stroke-width:2px
    style Features fill:#f9f,stroke:#333,stroke-width:2px
```

## Frontend Component Architecture

The frontend architecture follows a component-based design pattern for modularity and reusability:

```mermaid
graph TD
    App[App.tsx] --> Router[Router]
    Router --> Pages[Pages]
    Router --> Components[Components]
    
    subgraph "Pages"
        Pages --> DashboardPage[Dashboard]
        Pages --> AuthPages[Auth Pages]
        Pages --> FeaturePages[Feature Pages]
    end
    
    subgraph "Feature Pages"
        FeaturePages --> AIPage[AI Health Insights]
        FeaturePages --> NFTPage[NFT Education]
        FeaturePages --> ResearchPage[Research Marketplace]
    end
    
    subgraph "Components"
        Components --> Layout[Layout Components]
        Components --> UI[UI Components]
        Components --> Forms[Form Components]
    end
    
    subgraph "Layout Components"
        Layout --> MainLayout[MainLayout]
        Layout --> Header[Header]
        Layout --> Footer[Footer]
    end
    
    subgraph "Services"
        AuthService[Auth Service]
        ContractService[Contract Service]
        DataService[Data Service]
    end
    
    DashboardPage --> AuthService
    DashboardPage --> ContractService
    AIPage --> ContractService
    NFTPage --> ContractService
    ResearchPage --> ContractService
```

## Deployment Architecture

The application's deployment architecture leverages modern cloud infrastructure for scalability and reliability:

```mermaid
graph TD
    GitHub[GitHub Repository] --> Actions[GitHub Actions]
    Actions --> Build[Build Process]
    Build --> Test[Test Process]
    Test --> Deploy[Deploy Process]
    
    Deploy --> Frontend[Frontend Deployment]
    Deploy --> Contracts[Contract Deployment]
    
    subgraph "Frontend Deployment"
        Frontend --> Static[Static Assets]
        Static --> CDN[CDN]
    end
    
    subgraph "Contract Deployment"
        Contracts --> Testnet[Stellar Testnet]
        Contracts --> Mainnet[Stellar Mainnet]
    end
    
    CDN --> Users[End Users]
    Testnet --> Development[Development]
    Mainnet --> Production[Production]
```

## Security Architecture

Security is a fundamental aspect of CycleBuddy's architecture:

```mermaid
graph TD
    Data[User Data] --> Encryption[Client-Side Encryption]
    Encryption --> Storage[Encrypted Storage]
    Storage --> Access[Access Control]
    
    subgraph "Security Layers"
        Encryption
        Authentication[Authentication]
        Authorization[Authorization]
        Access
        Validation[Input Validation]
    end
    
    subgraph "Encryption Methods"
        Encryption --> Symmetric[Symmetric Encryption]
        Encryption --> Asymmetric[Asymmetric Encryption]
        Encryption --> ZKP[Zero-Knowledge Proofs]
    end
    
    subgraph "Authentication Methods"
        Authentication --> Passkeys[Stellar Passkeys]
        Authentication --> MultiSig[Multi-Signature]
        Authentication --> TimeBound[Time-Bound Access]
    end
    
    User[User] --> Authentication
    Authentication --> Authorization
    Authorization --> Access
    User --> Validation
    Validation --> Data
```

## Integration Architecture

CycleBuddy integrates with various external systems and services:

```mermaid
graph TB
    CycleBuddy[CycleBuddy Core] --> Wallet[Stellar Wallet]
    CycleBuddy --> DataStorage[Decentralized Storage]
    CycleBuddy --> ThirdParties[Third Parties]
    
    subgraph "Wallet Integration"
        Wallet --> Freighter[Freighter]
        Wallet --> Albedo[Albedo]
        Wallet --> Future[Future Wallets]
    end
    
    subgraph "Storage Integration"
        DataStorage --> IPFS[IPFS]
        DataStorage --> StellarDataEntries[Stellar Data Entries]
    end
    
    subgraph "Third-Party Integration"
        ThirdParties --> HealthProviders[Healthcare Providers]
        ThirdParties --> Researchers[Research Institutions]
        ThirdParties --> Partners[Educational Partners]
    end
```

## Scalability Architecture

The architecture is designed to scale to accommodate a growing user base and feature set:

```mermaid
graph LR
    Load[User Load] --> Scaling[Scaling Mechanisms]
    
    subgraph "Scaling Mechanisms"
        Scaling --> Frontend[Frontend Scaling]
        Scaling --> Storage[Storage Scaling]
        Scaling --> Blockchain[Blockchain Scaling]
    end
    
    subgraph "Frontend Scaling"
        Frontend --> StaticServing[Static Serving]
        Frontend --> CDN[CDN Distribution]
        Frontend --> ClientSideComputing[Client-Side Computing]
    end
    
    subgraph "Storage Scaling"
        Storage --> IPFSNetwork[IPFS Network]
        Storage --> DistributedStorage[Distributed Storage]
    end
    
    subgraph "Blockchain Scaling"
        Blockchain --> Soroban[Soroban Platform]
        Blockchain --> EffectiveTXs[Effective Transaction Design]
        Blockchain --> StateMinimization[State Minimization]
    end
```

## Data Privacy Architecture

Privacy is a core architectural principle in CycleBuddy:

```mermaid
graph TD
    Data[User Data] --> Classification[Data Classification]
    Classification --> Controls[Privacy Controls]
    
    subgraph "Data Classification"
        Classification --> Health[Health Data]
        Classification --> Preferences[User Preferences]
        Classification --> Identity[Identity Data]
    end
    
    subgraph "Privacy Controls"
        Controls --> ClientEncryption[Client-Side Encryption]
        Controls --> ZKP[Zero-Knowledge Proofs]
        Controls --> Anonymization[Data Anonymization]
        Controls --> ConsentManagement[Consent Management]
    end
    
    subgraph "Privacy by Design Principles"
        MinimalCollection[Minimal Collection]
        PurposeLimitation[Purpose Limitation]
        DataMinimization[Data Minimization]
        UserControl[User Control]
    end
    
    Controls --> MinimalCollection
    Controls --> PurposeLimitation
    Controls --> DataMinimization
    Controls --> UserControl
```

## Conclusion

CycleBuddy's architecture is designed with security, privacy, scalability, and user experience as core principles. By leveraging the Stellar blockchain and modern web technologies, we've created a system that empowers users with control over their health data while enabling innovative features that were previously impossible in traditional health applications.

The modular, contract-based design allows for future expansion and upgrades without compromising the security or integrity of existing user data. This architecture document serves as a guide for understanding the system's components and their interactions, providing a foundation for future development and enhancement. 