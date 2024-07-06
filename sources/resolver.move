module sender::resolver {

    use std::signer;
    use std::vector;
    use std::event;
    use std::string::String;
    use std::string;
    use std::table::{Self, Table};
    use std::object;

    // Errors
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;

    const SCHEMA: vector<u8> = b"AptosNameResolver";

    struct Resolver has key {
        addr: address,
        addrext: Table<u256, vector<u8>>,
        text: Table<String, String>,
        contenthash: vector<u8>,
    }

    struct EventBooking has key {
        node: vector<u8>,
        event_id: String,
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
        let object_address = object::create_object_address(signer_address, get_seed(node));

        // check if signer hasn't initialized resolver
        assert!(!object::is_object(object_address), E_ALREADY_INITIALIZED);

        // Creates the object
        let constructor_ref = object::create_named_object(account, get_seed(node), false);

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
        let object_address = object::create_object_address(addr, get_seed(node));
        return object::is_object(object_address)
    }

    public entry fun set_addr(account: &signer, node: vector<u8>, addr: address) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(signer_address, get_seed(node));

        // assert signer has created a resolver resource
        if(!object::is_object(object_address)) {
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
        let object_address = object::create_object_address(addr, get_seed(node));
        assert!(object::is_object(object_address), E_NOT_INITIALIZED);
        borrow_global<Resolver>(object_address).addr
    }

    public entry fun set_addr_ext(account: &signer, node: vector<u8>, cointype: u256, addr: vector<u8>) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(signer_address, get_seed(node));

        // assert signer has created a resolver resource
        if(!object::is_object(object_address)) {
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
        let object_address = object::create_object_address(addr, get_seed(node));
        assert!(object::is_object(object_address), E_NOT_INITIALIZED);
        let resolver = borrow_global<Resolver>(object_address);
        *table::borrow(&resolver.addrext, cointype)
    }

    public entry fun set_text(account: &signer, node: vector<u8>, key: String, value: String) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(signer_address, get_seed(node));

        // assert signer has created a resolver resource
        if(!object::is_object(object_address)) {
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
        let object_address = object::create_object_address(addr, get_seed(node));
        assert!(object::is_object(object_address), E_NOT_INITIALIZED);
        let resolver = borrow_global<Resolver>(object_address);
        *table::borrow(&resolver.text, key)
    }

    public entry fun set_contenthash(account: &signer, node: vector<u8>, contenthash: vector<u8>) acquires Resolver {
        // gets the signer address
        let signer_address = signer::address_of(account);

        // Calculate object address to check for existence
        let object_address = object::create_object_address(signer_address, get_seed(node));

        // assert signer has created a resolver resource
        if(!object::is_object(object_address)) {
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

    public entry fun multiset(
        account: &signer,
        node: vector<u8>,
        aptos_addr: address,
        cointypes: vector<u256>,
        addrs: vector<vector<u8>>,
        text_keys: vector<String>,
        texts: vector<String>,
        event_id: String
    ) acquires Resolver {
        set_addr(account, node, aptos_addr);

        let cointypes_n = vector::length(&cointypes);
        let texts_n = vector::length(&text_keys);

        for (i in 0..cointypes_n) {
            set_addr_ext(account, node, *vector::borrow(&cointypes, i), *vector::borrow(&addrs, i))
        };

        for (i in 0..texts_n) {
            set_text(account, node, *vector::borrow(&text_keys, i), *vector::borrow(&texts, i))
        };

        if (!string::is_empty(&event_id)) {
            // Create object
            let caller_address = signer::address_of(account);
            let constructor_ref = object::create_object(caller_address, false);
            let object_signer = object::generate_signer(&constructor_ref);
            
            // Set up the object by creating booking in it
            move_to(&object_signer, EventBooking {
                node: node,
                event_id: event_id,
            });
        }
    }

    #[view]
    public fun get_contenthash(addr: address, node: vector<u8>): vector<u8> acquires Resolver {
        let object_address = object::create_object_address(addr, get_seed(node));
        assert!(object::is_object(object_address), E_NOT_INITIALIZED);
        borrow_global<Resolver>(object_address).contenthash
    }

    #[test(account = @0x1)]
    public entry fun sender_create_resolver(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        std::account::create_account_for_test(addr);

        assert!(!has_resolver(addr, b"node"), 0);
        set_addr(&account, b"node", addr);
        assert!(has_resolver(addr, b"node"), 0);
    }

    #[test(account = @0x1)]
    public entry fun sender_can_set_addr(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        std::account::create_account_for_test(addr);

        set_addr(&account, b"node", addr);
        assert!(get_addr(addr, b"node") == addr, 0);
    }

    #[test(account = @0x1)]
    public entry fun sender_can_set_addr_ext(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        std::account::create_account_for_test(addr);

        let cointype = 60;
        let evmaddr = x"C360dadbDfC2a30CbDBE1d34a6dB805B17627044";

        set_addr_ext(&account, b"node", cointype, evmaddr);
        assert!(get_addr_ext(addr, b"node", cointype) == evmaddr, 0);
    }

    #[test(account = @0x1)]
    public entry fun sender_can_set_text(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        std::account::create_account_for_test(addr);

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
        std::account::create_account_for_test(addr);

        let contenthash = b"dummy-vector<u8>";

        set_contenthash(&account, b"node", contenthash);
        assert!(get_contenthash(addr, b"node") == contenthash, 0);
    }

    #[test(account = @0x1)]
    public entry fun sender_can_multiset(account: signer) acquires Resolver {
        let addr = signer::address_of(&account);
        std::account::create_account_for_test(addr);

        let cointype1= 60;
        let evmaddr1 = x"C360dadbDfC2a30CbDBE1d34a6dB805B17627044";
        let cointype2 = 61;
        let evmaddr2 = x"BB60dadbDfC2a30CbDBE1d34a6dB805B176270BB";

        let key1 = string::utf8(b"com.twitter");
        let value1 = string::utf8(b"chomtana");
        let key2 = string::utf8(b"com.discord");
        let value2 = string::utf8(b"chomtana2");

        let cointypes = vector<u256>[];
        vector::push_back(&mut cointypes, cointype1);
        vector::push_back(&mut cointypes, cointype2);

        let addrs = vector<vector<u8>>[];
        vector::push_back(&mut addrs, evmaddr1);
        vector::push_back(&mut addrs, evmaddr2);

        let text_keys = vector<String>[];
        vector::push_back(&mut text_keys, key1);
        vector::push_back(&mut text_keys, key2);

        let texts = vector<String>[];
        vector::push_back(&mut texts, value1);
        vector::push_back(&mut texts, value2);

        multiset(
            &account,
            b"node",
            addr,
            cointypes,
            addrs,
            text_keys,
            texts,
            string::utf8(b"ivs-demo")
        );

        assert!(get_addr(addr, b"node") == addr, 0);
        assert!(get_addr_ext(addr, b"node", cointype1) == evmaddr1, 0);
        assert!(get_addr_ext(addr, b"node", cointype2) == evmaddr2, 0);
        assert!(get_text(addr, b"node", key1) == value1, 0);
        assert!(get_text(addr, b"node", key2) == value2, 0);
    }
}