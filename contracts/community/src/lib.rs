#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol, Vec, String, Bytes, symbol_short, contracterror};

#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum CommunityError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    PostNotFound = 3,
    Unauthorized = 4,
    PostNotApproved = 5,
    StorageError = 6,
    CommentNotFound = 7,
    NotModerator = 8,
}

/// Data storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    RegistryContract,
    PostIndex,              // All post IDs
    Post(BytesN<32>),       // Post ID -> Post
    Moderator(Address),     // Address -> bool
    UserPosts(Address),     // User -> Vec<post_ids>
    Category(Symbol),       // Category -> Vec<post_ids>
    Vote(BytesN<32>, Address), // Post ID, User -> VoteType
    Reward(Address),        // User -> i128
    Comment(BytesN<32>),    // Comment data by ID
}

/// Post status enum
#[derive(Clone, PartialEq, Copy)]
#[contracttype]
pub enum PostStatus {
    Pending,
    Approved,
    Rejected,
}

/// Voting enum
#[derive(Clone, PartialEq, Copy)]
#[contracttype]
pub enum VoteType {
    Upvote,
    Downvote,
}

/// A community post
#[derive(Clone)]
#[contracttype]
pub struct Post {
    pub id: BytesN<32>,          // Unique identifier
    pub title: String,
    pub content: String,
    pub author: Address,         // Author's address
    pub category: Symbol,        // Category (e.g., "education", "question")
    pub timestamp: u64,          // Timestamp
    pub status: PostStatus,      // Moderation status
    pub upvotes: i128,           // Number of up votes
    pub downvotes: i128,         // Number of down votes
    pub approved: bool,          // Whether the post is approved
    pub comments: Vec<BytesN<32>>, // IDs of comments on this post
    pub is_removed: bool,          // For moderation
}

/// A comment on a post
#[derive(Clone)]
#[contracttype]
pub struct Comment {
    pub author: Address,
    pub content: String,
    pub timestamp: u64,
    pub likes: i128,
    pub is_removed: bool,      // For moderation
}

#[contract]
pub struct CommunityContract;

#[contractimpl]
impl CommunityContract {
    /// Initialize the contract with registry address
    pub fn initialize(
        env: Env,
        owner: Address,
        registry_contract: Address,
    ) -> Result<(), CommunityError> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(CommunityError::AlreadyInitialized);
        }
        
        // Verify caller is the owner
        owner.require_auth();
        
        // Initialize contract storage
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::RegistryContract, &registry_contract);
        
        // Initialize post index
        env.storage().instance().set(&DataKey::PostIndex, &Vec::<BytesN<32>>::new(&env));
        
        // Add owner as a moderator
        env.storage().instance().set(&DataKey::Moderator(owner.clone()), &true);
        
        // Log initialization
        env.events().publish(
            (symbol_short!("init"), symbol_short!("comm")),
            owner
        );
        
        Ok(())
    }
    
    /// Generate a random post ID
    fn generate_post_id(env: &Env) -> BytesN<32> {
        // Create a random seed based on the timestamp
        let timestamp = env.ledger().timestamp();
        let random_bytes = timestamp.to_be_bytes();
        
        // Create a BytesN object from the random bytes for hashing
        let bytes_to_hash = Bytes::from_array(env, &random_bytes);
        
        // Hash the bytes to get a deterministic but random-like BytesN<32>
        env.crypto().sha256(&bytes_to_hash)
    }
    
    /// Create a new post
    pub fn create_post(
        env: Env,
        author: Address,
        title: String,
        content: String,
        category: Symbol,
    ) -> Result<BytesN<32>, CommunityError> {
        author.require_auth();
        
        let timestamp = env.ledger().timestamp();
        let post_id = Self::generate_post_id(&env);
        
        let post = Post {
            id: post_id.clone(),
            title,
            content,
            author: author.clone(),
            category: category.clone(),
            timestamp,
            status: PostStatus::Pending,
            upvotes: 0,
            downvotes: 0,
            approved: false,
            comments: Vec::new(&env),
            is_removed: false,
        };
        
        env.storage().instance().set(&DataKey::Post(post_id.clone()), &post);
        
        // Update post index
        let post_index = env.storage().instance().get::<DataKey, Vec<BytesN<32>>>(&DataKey::PostIndex);
        let mut post_index = match post_index {
            Some(index) => index,
            None => Vec::new(&env),
        };
        post_index.push_back(post_id.clone());
        env.storage().instance().set(&DataKey::PostIndex, &post_index);
        
        // Update user posts
        let user_posts = env.storage().instance().get::<DataKey, Vec<BytesN<32>>>(&DataKey::UserPosts(author.clone()));
        let mut user_posts = match user_posts {
            Some(posts) => posts,
            None => Vec::new(&env),
        };
        user_posts.push_back(post_id.clone());
        env.storage().instance().set(&DataKey::UserPosts(author.clone()), &user_posts);
        
        // Update category posts
        let category_posts = env.storage().instance().get::<DataKey, Vec<BytesN<32>>>(&DataKey::Category(category.clone()));
        let mut category_posts = match category_posts {
            Some(posts) => posts,
            None => Vec::new(&env),
        };
        category_posts.push_back(post_id.clone());
        env.storage().instance().set(&DataKey::Category(category.clone()), &category_posts);
        
        env.events().publish(
            (symbol_short!("create"), symbol_short!("post")),
            (author, post_id.clone(), category)
        );
        
        Ok(post_id)
    }
    
    /// Moderate a post (approve or reject)
    pub fn moderate_post(
        env: Env,
        moderator: Address,
        post_id: BytesN<32>,
        approve: bool,
    ) -> Result<(), CommunityError> {
        if !Self::is_moderator(&env, moderator.clone()) {
            return Err(CommunityError::NotModerator);
        }
        
        moderator.require_auth();
        
        let post = env.storage().instance().get::<DataKey, Post>(&DataKey::Post(post_id.clone()));
        let mut post = match post {
            Some(post) => post,
            None => return Err(CommunityError::PostNotFound),
        };
        
        post.status = if approve { PostStatus::Approved } else { PostStatus::Rejected };
        
        env.storage().instance().set(&DataKey::Post(post_id.clone()), &post);
        
        if approve {
            Self::award_author(env.clone(), post.author.clone())?;
        }
        
        env.events().publish(
            (if approve { symbol_short!("approve") } else { symbol_short!("reject") }, symbol_short!("post")), 
            (moderator, post_id.clone())
        );
        
        Ok(())
    }
    
    /// Add a moderator
    pub fn add_moderator(
        env: Env,
        owner: Address,
        new_moderator: Address,
    ) -> Result<(), CommunityError> {
        let contract_owner = Self::get_owner_internal(&env)?;
        if owner != contract_owner {
            return Err(CommunityError::Unauthorized);
        }
        
        owner.require_auth();
        
        env.storage().instance().set(&DataKey::Moderator(new_moderator.clone()), &true);
        
        env.events().publish(
            (symbol_short!("add"), symbol_short!("mod")),
            (owner, new_moderator)
        );
        
        Ok(())
    }
    
    /// Remove a moderator
    pub fn remove_moderator(
        env: Env,
        owner: Address,
        moderator_to_remove: Address,
    ) -> Result<(), CommunityError> {
        let contract_owner = Self::get_owner_internal(&env)?;
        if owner != contract_owner {
            return Err(CommunityError::Unauthorized);
        }
        
        owner.require_auth();
        
        env.storage().instance().remove(&DataKey::Moderator(moderator_to_remove.clone()));
        
        env.events().publish(
            (symbol_short!("remove"), symbol_short!("mod")),
            (owner, moderator_to_remove)
        );
        
        Ok(())
    }
    
    /// Vote on a post
    pub fn vote(
        env: Env,
        user: Address,
        post_id: BytesN<32>,
        vote_type: VoteType,
    ) -> Result<(), CommunityError> {
        user.require_auth();
        
        let post = env.storage().instance().get::<DataKey, Post>(&DataKey::Post(post_id.clone()));
        let mut post = match post {
            Some(post) => post,
            None => return Err(CommunityError::PostNotFound),
        };
        
        if post.status != PostStatus::Approved {
            return Err(CommunityError::PostNotApproved);
        }
        
        let previous_vote = env.storage().instance().get::<DataKey, VoteType>(&DataKey::Vote(post_id.clone(), user.clone()));

        if let Some(prev_vote) = previous_vote {
            if prev_vote == vote_type {
                // Cancel the vote
                if prev_vote == VoteType::Upvote { post.upvotes -= 1; } 
                else { post.downvotes -= 1; }
                env.storage().instance().remove(&DataKey::Vote(post_id.clone(), user.clone()));
            } else {
                // Change vote type
                if vote_type == VoteType::Upvote { post.downvotes -= 1; post.upvotes += 1; }
                else { post.upvotes -= 1; post.downvotes += 1; }
                env.storage().instance().set(&DataKey::Vote(post_id.clone(), user.clone()), &vote_type);
            }
        } else {
            // New vote
            if vote_type == VoteType::Upvote { post.upvotes += 1; }
            else { post.downvotes += 1; }
            env.storage().instance().set(&DataKey::Vote(post_id.clone(), user.clone()), &vote_type);
        }
        
        env.storage().instance().set(&DataKey::Post(post_id.clone()), &post);
        env.events().publish(
            (symbol_short!("vote"), symbol_short!("cast")),
            (user, post_id, vote_type)
        );
        Ok(())
    }
    
    /// Get a post by ID
    pub fn get_post(
        env: Env,
        post_id: BytesN<32>,
    ) -> Result<Post, CommunityError> {
        let post = env.storage().instance().get::<DataKey, Post>(&DataKey::Post(post_id));
        match post {
            Some(post) => Ok(post),
            None => Err(CommunityError::PostNotFound),
        }
    }
    
    /// Get a comment by ID
    pub fn get_comment(
        env: Env,
        comment_id: BytesN<32>,
    ) -> Result<Comment, CommunityError> {
        let comment = env.storage().instance().get::<DataKey, Comment>(&DataKey::Comment(comment_id));
        match comment {
            Some(comment) => Ok(comment),
            None => Err(CommunityError::CommentNotFound),
        }
    }
    
    /// List all approved posts
    pub fn list_approved_posts(env: Env) -> Result<Vec<BytesN<32>>, CommunityError> {
        let post_index = env.storage().instance().get::<DataKey, Vec<BytesN<32>>>(&DataKey::PostIndex);
        let post_index = match post_index {
            Some(index) => index,
            None => return Ok(Vec::new(&env)),
        };
        
        let mut approved_posts = Vec::new(&env);
        
        for i in 0..post_index.len() {
            let post_id = post_index.get_unchecked(i);
            if let Some(post) = env.storage().instance().get::<DataKey, Post>(&DataKey::Post(post_id.clone())) {
                if post.status == PostStatus::Approved {
                    approved_posts.push_back(post_id.clone());
                }
            }
        }
        
        Ok(approved_posts)
    }
    
    /// List posts by category
    pub fn list_posts_by_category(env: Env, category: Symbol) -> Result<Vec<BytesN<32>>, CommunityError> {
        let category_posts = env.storage().instance().get::<DataKey, Vec<BytesN<32>>>(&DataKey::Category(category));
        match category_posts {
            Some(posts) => Ok(posts),
            None => Ok(Vec::new(&env)),
        }
    }
    
    /// List posts by user
    pub fn list_posts_by_user(env: Env, user: Address) -> Result<Vec<BytesN<32>>, CommunityError> {
        let user_posts = env.storage().instance().get::<DataKey, Vec<BytesN<32>>>(&DataKey::UserPosts(user));
        match user_posts {
            Some(posts) => Ok(posts),
            None => Ok(Vec::new(&env)),
        }
    }
    
    /// Award tokens to an author (internal function)
    fn award_author(
        env: Env,
        author: Address,
    ) -> Result<(), CommunityError> {
        let current_reward = env.storage().instance().get::<DataKey, i128>(&DataKey::Reward(author.clone()));
        let current_reward = match current_reward {
            Some(reward) => reward,
            None => 0,
        };
        
        let new_reward = current_reward + 10;
        env.storage().instance().set(&DataKey::Reward(author.clone()), &new_reward);
        
        env.events().publish(
            (symbol_short!("reward"), symbol_short!("author")),
            (author, new_reward)
        );
        
        Ok(())
    }
    
    /// Get user's reward balance
    pub fn get_user_rewards(env: Env, user: Address) -> Result<i128, CommunityError> {
        let reward = env.storage().instance().get::<DataKey, i128>(&DataKey::Reward(user));
        match reward {
            Some(reward) => Ok(reward),
            None => Ok(0),
        }
    }
    
    /// Check if an address is a moderator
    pub fn is_moderator(
        env: &Env,
        moderator_address: Address,
    ) -> bool {
        match env.storage().instance().get::<DataKey, bool>(&DataKey::Moderator(moderator_address)) {
            Some(is_mod) => is_mod,
            None => false,
        }
    }
    
    /// Get the contract owner
    fn get_owner_internal(env: &Env) -> Result<Address, CommunityError> {
        let owner = env.storage().instance().get::<DataKey, Address>(&DataKey::Owner);
        match owner {
            Some(addr) => Ok(addr),
            None => Err(CommunityError::NotInitialized),
        }
    }
}

/// Unit tests for the community contract
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, AuthorizedFunction, Events};
    use soroban_sdk::{vec};

    #[test]
    fn test_create_and_moderate_post() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, CommunityContract);
        let client = CommunityContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        client.initialize(&owner, &registry);

        let author = Address::generate(&env);
        let title = String::from_str(&env, "Test Post");
        let content = String::from_str(&env, "This is a test post.");
        let category = symbol_short!("edu");
        
        let post_id = client.create_post(&author, &title, &content, &category);
        
        let post = client.get_post(&post_id);
        assert_eq!(post.status, PostStatus::Pending);
        
        client.moderate_post(&owner, &post_id, &true);
        
        let post_after_mod = client.get_post(&post_id);
        assert_eq!(post_after_mod.status, PostStatus::Approved);
        
        let reward = client.get_user_rewards(&author);
        assert_eq!(reward, 10);
    }
    
    #[test]
    fn test_voting() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, CommunityContract);
        let client = CommunityContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        client.initialize(&owner, &Address::generate(&env));
        let author = Address::generate(&env);
        let voter = Address::generate(&env);
        
        let title = String::from_str(&env, "VotingPost");
        let content = String::from_str(&env, "Vote here!");
        let category = symbol_short!("poll");
        
        let post_id = client.create_post(&author, &title, &content, &category);
        client.moderate_post(&owner, &post_id, &true); 
        
        client.vote(&voter, &post_id, &VoteType::Upvote);
        let post_after_upvote = client.get_post(&post_id);
        assert_eq!(post_after_upvote.upvotes, 1);
        
        client.vote(&voter, &post_id, &VoteType::Downvote);
        let post_after_downvote = client.get_post(&post_id);
        assert_eq!(post_after_downvote.upvotes, 0);
        assert_eq!(post_after_downvote.downvotes, 1);

        client.vote(&voter, &post_id, &VoteType::Downvote);
        let post_after_remove_vote = client.get_post(&post_id);
        assert_eq!(post_after_remove_vote.downvotes, 0);
    }
} 