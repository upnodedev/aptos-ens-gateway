module sender::resolver {

    use aptos_framework::account;
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use std::string::String;
    use aptos_std::table::{Self, Table};
    #[test_only]
    use std::string;
    use aptos_framework::object;

    // Errors
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;

    const SCHEMA: vector<u8> = b"AptosNameResolver";

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Resolver has key {
        addr: address,
        addrext: Table<u256, vector<u8>>,
        text: Table<String, String>,
        contenthash: vector<u8>,
    }

    #[event]
    struct ResolverCreated has drop, store {
        account: address,
        node: vector<u8>,
    }

    #[event]
    struct AddrChanged has drop, store {
        account: address,
        node: vector<u8>,
        addr: address,
    }

    #[event]
    struct AddrExtChanged has drop, store {
        account: address,
        node: vector<u8>,
        cointype: u256,
        addr: vector<u8>,
    }

    #[event]
    struct TextChanged has drop, store {
        account: address,
        node: vector<u8>,
        key: String,
        value: String,
    }

    #[event]
    struct ContentHashChanged has drop, store {
        account: address,
        node: vector<u8>,
        contenthash: vector<u8>,
    }

    fun get_seed(node: vector<u8>): vector<u8> {
        vector::append(&mut node, SCHEMA);
        node
    }

    public entry fun create_resolver(account: &signer, node: vector<u8>) {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(&signer_address, get_seed(node));

        // check if signer hasn't initialized resolver
        assert!(!object::object_exists<0x1::object::ObjectCore>(object_address), E_ALREADY_INITIALIZED);

        // Creates the object
        let constructor_ref = object::create_named_object(account, get_seed(node));

        // Retrieves a signer for the object
        let object_signer = object::generate_signer(&constructor_ref);

        let resolver = Resolver {
            addr: signer_address,
            addrext: table::new(),
            text: table::new(),
            contenthash: vector::empty<u8>(),
        };

        // move the Resolver resource under the signer account
        move_to(&object_signer, resolver);

        // Emit ResolverCreated event for indexer
        event::emit(ResolverCreated {
            account: signer_address,
            node,
        });
    }

    #[view]
    public fun has_resolver(addr: address, node: vector<u8>): bool {
        // Calculate object address to check for existence
        let object_address = object::create_object_address(&addr, get_seed(node));
        return object::object_exists<0x1::object::ObjectCore>(object_address)
    }

    public entry fun set_addr(account: &signer, node: vector<u8>, addr: address) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(&signer_address, get_seed(node));

        // assert signer has created a resolver resource
        if(!object::object_exists<0x1::object::ObjectCore>(object_address)) {
            create_resolver(account, node);
        };

        // gets the resolver resource
        let resolver = borrow_global_mut<Resolver>(object_address);

        // put address to the resolver
        resolver.addr = addr;

        // Emit AddrChanged event for indexer
        event::emit(AddrChanged {
            account: signer_address,
            node,
            addr,
        });
    }

    #[view]
    public fun get_addr(addr: address, node: vector<u8>): address acquires Resolver {
        let object_address = object::create_object_address(&addr, get_seed(node));
        assert!(object::object_exists<0x1::object::ObjectCore>(object_address), E_NOT_INITIALIZED);
        borrow_global<Resolver>(object_address).addr
    }

    public entry fun set_addr_ext(account: &signer, node: vector<u8>, cointype: u256, addr: vector<u8>) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(&signer_address, get_seed(node));

        // assert signer has created a resolver resource
        if(!object::object_exists<0x1::object::ObjectCore>(object_address)) {
            create_resolver(account, node);
        };

        // gets the resolver resource
        let resolver = borrow_global_mut<Resolver>(object_address);

        // remove key from the table if exists
        if (table::contains(&resolver.addrext, cointype)) {
            table::remove(&mut resolver.addrext, cointype);
        };

        // add value to the table
        table::add(&mut resolver.addrext, cointype, addr);

        // Emit AddrChanged event for indexer
        event::emit(AddrExtChanged {
            account: signer_address,
            node,
            cointype,
            addr,
        });
    }

    #[view]
    public fun get_addr_ext(addr: address, node: vector<u8>, cointype: u256): vector<u8> acquires Resolver {
        let object_address = object::create_object_address(&addr, get_seed(node));
        assert!(object::object_exists<0x1::object::ObjectCore>(object_address), E_NOT_INITIALIZED);
        let resolver = borrow_global<Resolver>(object_address);
        *table::borrow(&resolver.addrext, cointype)
    }

    public entry fun set_text(account: &signer, node: vector<u8>, key: String, value: String) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(&signer_address, get_seed(node));

        // assert signer has created a resolver resource
        if(!object::object_exists<0x1::object::ObjectCore>(object_address)) {
            create_resolver(account, node);
        };

        // gets the resolver resource
        let resolver = borrow_global_mut<Resolver>(object_address);

        // remove key from the table if exists
        if (table::contains(&resolver.text, key)) {
            table::remove(&mut resolver.text, key);
        };

        // add value to the table
        table::add(&mut resolver.text, key, value);

        // Emit TextChanged event for indexer
        event::emit(TextChanged {
            account: signer_address,
            node,
            key,
            value,
        });
    }

    #[view]
    public fun get_text(addr: address, node: vector<u8>, key: String): String acquires Resolver {
        let object_address = object::create_object_address(&addr, get_seed(node));
        assert!(object::object_exists<0x1::object::ObjectCore>(object_address), E_NOT_INITIALIZED);
        let resolver = borrow_global<Resolver>(object_address);
        *table::borrow(&resolver.text, key)
    }

    public entry fun set_contenthash(account: &signer, node: vector<u8>, contenthash: vector<u8>) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(&signer_address, get_seed(node));

        // assert signer has created a resolver resource
        if(!object::object_exists<0x1::object::ObjectCore>(object_address)) {
            create_resolver(account, node);
        };

        // gets the resolver resource
        let resolver = borrow_global_mut<Resolver>(object_address);

        // set contenthash
        resolver.contenthash = contenthash;

        // Emit AddrChanged event for indexer
        event::emit(ContentHashChanged {
            account: signer_address,
            node,
            contenthash,
        });
    }

    #[view]
    public fun get_contenthash(addr: address, node: vector<u8>): vector<u8> acquires Resolver {
        let object_address = object::create_object_address(&addr, get_seed(node));
        assert!(object::object_exists<0x1::object::ObjectCore>(object_address), E_NOT_INITIALIZED);
        borrow_global<Resolver>(object_address).contenthash
    }

    #[test(account = @0x1)]
    public entry fun sender_create_resolver(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);

        assert!(!has_resolver(addr, b"node"), 0);
        set_addr(&account, b"node", addr);
        assert!(has_resolver(addr, b"node"), 0);
    }

    #[test(account = @0x1)]
    public entry fun sender_can_set_addr(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);

        set_addr(&account, b"node", addr);
        assert!(get_addr(addr, b"node") == addr, 0);
    }

    #[test(account = @0x1)]
    public entry fun sender_can_set_addr_ext(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);

        let cointype = 60;
        let evmaddr = x"C360dadbDfC2a30CbDBE1d34a6dB805B17627044";

        set_addr_ext(&account, b"node", cointype, evmaddr);
        assert!(get_addr_ext(addr, b"node", cointype) == evmaddr, 0);
    }

    #[test(account = @0x1)]
    public entry fun sender_can_set_text(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);

        let key = string::utf8(b"com.twitter");
        let value = string::utf8(b"chomtana");
        let value2 = string::utf8(b"chomtana2");

        set_text(&account, b"node", key, value);
        assert!(get_text(addr, b"node", key) == value, 0);
        set_text(&account, b"node", key, value2);
        assert!(get_text(addr, b"node", key) == value2, 0);
    }

    #[test(account = @0x1)]
    public entry fun sender_can_set_contenthash(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);

        let contenthash = b"dummy-vector<u8>";

        set_contenthash(&account, b"node", contenthash);
        assert!(get_contenthash(addr, b"node") == contenthash, 0);
    }
}