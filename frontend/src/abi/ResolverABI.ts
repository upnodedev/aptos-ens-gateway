export default {
  "address": "0x4aac1f0a41d1251b67e7623b3bdf3034cbd4bb05938a1129ddd9dec3ba8ed200",
  "name": "resolver",
  "friends": [],
  "exposed_functions": [
    {
      "name": "create_resolver",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "vector<u8>"
      ],
      "return": []
    },
    {
      "name": "get_addr",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "vector<u8>"
      ],
      "return": [
        "address"
      ]
    },
    {
      "name": "get_addr_ext",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "vector<u8>",
        "u256"
      ],
      "return": [
        "vector<u8>"
      ]
    },
    {
      "name": "get_contenthash",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "vector<u8>"
      ],
      "return": [
        "vector<u8>"
      ]
    },
    {
      "name": "get_text",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "vector<u8>",
        "0x1::string::String"
      ],
      "return": [
        "0x1::string::String"
      ]
    },
    {
      "name": "has_resolver",
      "visibility": "public",
      "is_entry": false,
      "is_view": true,
      "generic_type_params": [],
      "params": [
        "address",
        "vector<u8>"
      ],
      "return": [
        "bool"
      ]
    },
    {
      "name": "set_addr",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "vector<u8>",
        "address"
      ],
      "return": []
    },
    {
      "name": "set_addr_ext",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "vector<u8>",
        "u256",
        "vector<u8>"
      ],
      "return": []
    },
    {
      "name": "set_contenthash",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "vector<u8>",
        "vector<u8>"
      ],
      "return": []
    },
    {
      "name": "set_text",
      "visibility": "public",
      "is_entry": true,
      "is_view": false,
      "generic_type_params": [],
      "params": [
        "&signer",
        "vector<u8>",
        "0x1::string::String",
        "0x1::string::String"
      ],
      "return": []
    }
  ],
  "structs": [
    {
      "name": "AddrChanged",
      "is_native": false,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "account",
          "type": "address"
        },
        {
          "name": "node",
          "type": "vector<u8>"
        },
        {
          "name": "addr",
          "type": "address"
        }
      ]
    },
    {
      "name": "AddrExtChanged",
      "is_native": false,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "account",
          "type": "address"
        },
        {
          "name": "node",
          "type": "vector<u8>"
        },
        {
          "name": "cointype",
          "type": "u256"
        },
        {
          "name": "addr",
          "type": "vector<u8>"
        }
      ]
    },
    {
      "name": "ContentHashChanged",
      "is_native": false,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "account",
          "type": "address"
        },
        {
          "name": "node",
          "type": "vector<u8>"
        },
        {
          "name": "contenthash",
          "type": "vector<u8>"
        }
      ]
    },
    {
      "name": "Resolver",
      "is_native": false,
      "abilities": [
        "key"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "addr",
          "type": "address"
        },
        {
          "name": "addrext",
          "type": "0x1::table::Table<u256, vector<u8>>"
        },
        {
          "name": "text",
          "type": "0x1::table::Table<0x1::string::String, 0x1::string::String>"
        },
        {
          "name": "contenthash",
          "type": "vector<u8>"
        }
      ]
    },
    {
      "name": "ResolverCreated",
      "is_native": false,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "account",
          "type": "address"
        },
        {
          "name": "node",
          "type": "vector<u8>"
        }
      ]
    },
    {
      "name": "TextChanged",
      "is_native": false,
      "abilities": [
        "drop",
        "store"
      ],
      "generic_type_params": [],
      "fields": [
        {
          "name": "account",
          "type": "address"
        },
        {
          "name": "node",
          "type": "vector<u8>"
        },
        {
          "name": "key",
          "type": "0x1::string::String"
        },
        {
          "name": "value",
          "type": "0x1::string::String"
        }
      ]
    }
  ]
} as const