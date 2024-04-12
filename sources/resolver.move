module sender::resolver {

    use aptos_framework::account;
    use std::signer;
    use aptos_framework::event;
    use std::string::String;
    use aptos_std::table::{Self, Table};
    #[test_only]
    use std::string;
    use aptos_framework::object;

    // Errors
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Resolver has key {
        addr: address,
        text: Table<String, String>,
    }

    public entry fun create_resolver(account: &signer, node: vector<u8>) {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(&signer_address, node);

        // check if signer hasn't initialized resolver
        assert!(!object::object_exists<0x1::object::ObjectCore>(object_address), E_ALREADY_INITIALIZED);

        // Creates the object
        let constructor_ref = object::create_named_object(account, node);

        // Retrieves a signer for the object
        let object_signer = object::generate_signer(&constructor_ref);

        let resolver = Resolver {
            addr: signer_address,
            text: table::new(),
        };

        // move the Resolver resource under the signer account
        move_to(&object_signer, resolver);
    }

    public entry fun set_addr(account: &signer, node: vector<u8>, addr: address) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(&signer_address, node);

        // assert signer has created a resolver resource
        if(!object::object_exists<0x1::object::ObjectCore>(object_address)) {
            create_resolver(account, node);
        };

        // gets the resolver resource
        let resolver = borrow_global_mut<Resolver>(object_address);

        // put address to the resolver
        resolver.addr = addr;
    }

    #[view]
    public fun get_addr(addr: address, node: vector<u8>): address acquires Resolver {
        assert!(exists<Resolver>(addr), E_NOT_INITIALIZED);
        borrow_global<Resolver>(addr).addr
    }

    public entry fun set_text(account: &signer, node: vector<u8>, key: String, value: String) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);
        // assert signer has created a resolver resource
        assert!(exists<Resolver>(signer_address), E_NOT_INITIALIZED);
        // gets the resolver resource
        let resolver = borrow_global_mut<Resolver>(signer_address);

        // remove key from the table if exists
        if (table::contains(&resolver.text, key)) {
            table::remove(&mut resolver.text, key);
        };

        // add value to the table
        table::add(&mut resolver.text, key, value);
    }

    #[view]
    public fun get_text(addr: address, node: vector<u8>, key: String): String acquires Resolver {
        assert!(exists<Resolver>(addr), E_NOT_INITIALIZED);
        let resolver = borrow_global<Resolver>(addr);
        *table::borrow(&resolver.text, key)
    }
}