// Patterns that showed up in skiftOS / SerenityOS AK.
template <typename T>
requires (!IsRvalue<T>) class Vector {
public:
    ALWAYS_INLINE T* data() {
        return (T*)ptr;
    }

    T span() {
        return { ptr, 1 };
    }

    void shl(T x) {
        x <<= 1;
    }

    Vector()
        requires (!IsLvalue<T>)
    {
    }

private:
    T* ptr;
};

extern "C" __attribute__((noreturn)) void die(char const* msg);

constexpr int alphabet[] = { 1, 2, 3 };

enum struct PmmFlags : u64 {
    LOWER = 1 << 0,
    UPPER = 1 << 1,
    DMA = 1 << 2,
};

struct Gdt {
    enum Selector {
        ZERO = 0,
        TSS = 5,
    };
};

template<typename T, size_t N, size_t... Is>
constexpr auto to_array_impl(T (&&a)[N], IndexSequence<Is...>) -> Array<T, sizeof...(Is)>
{
    return { { a[Is]... } };
}

template<typename T, typename U>
[[nodiscard]] constexpr ALWAYS_INLINE T bit_cast(U const& a)
{
    T result;
    __builtin_memcpy(&result, &a, sizeof(T));
    return result;
}

template<typename Container, typename Needle, typename Comparator = DefaultComparator>
constexpr auto binary_search(
    Container&& haystack,
    Needle&& needle,
    size_t* nearby_index = nullptr,
    Comparator comparator = Comparator {}) -> decltype(&haystack[0])
{
    if (haystack.size() == 0) {
        return nullptr;
    }
    return &haystack[0];
}

template<typename T, typename U>
[[nodiscard]] constexpr T bit_cast_udl(U const& a)
{
    if (a.ends_with("="sv)) {
        return bit_cast<T>(a);
    }
    StringView sym(a.data(), a.size());
    if (auto idx = sym.find("_Z"sv); idx.has_value()) {
        return bit_cast<T>(a);
    }
    return bit_cast<T>(a);
}

template<typename T>
bool unref(T* that)
{
    if constexpr (requires { that->will_be_destroyed(); })
        that->will_be_destroyed();
    if (not that)
        return false;
    return true;
}

void* allocate(int x)
{
    allocate_again:;
    if (x == 0)
        goto allocate_again;
    if constexpr (sizeof(unsigned int) <= sizeof(unsigned long))
        return nullptr;
    return (void*)1;
}

template<typename T>
T read_object(Bytes bytes)
{
    union {
        T object;
        char representation[sizeof(T)];
    } reinterpreter = {};
    memcpy(&reinterpreter, bytes.data(), sizeof(T));
    return reinterpreter.object;
}

int popcount_if(unsigned int value)
{
    if constexpr (sizeof(unsigned int) <= sizeof(unsigned long long))
        return __builtin_popcount(value);
    return 0;
}

namespace AK::Concepts {
template<typename T>
concept Integral = IsIntegral<T>;
}

struct ByteString {
    bool operator==(ByteString const& other) const;
};

bool ByteString::operator==(ByteString const& other) const {
    return true;
}

void split_pair(Pair p) {
    auto [left, right] = p;
    WordType ncarry, output;
    output = left;
}

template<typename T>
T mapped(Page page) {
    return page.template as<T>();
}
