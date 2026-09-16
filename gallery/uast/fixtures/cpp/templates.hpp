// C++17: template args on a qualified name, and postfix <T>::member.
template <typename T>
struct HasContainerTraits {
    using type = T;
    static constexpr bool value = true;
};

class Wrapped {
public:
    HasContainerTraits<int>::type field;
    [[nodiscard]] int ping();
};

inline bool check_trait() {
    return HasContainerTraits<int>::value;
}

template <typename T>
std::string describe(T const &val) {
    if constexpr (std::is_same_v<T, bool>) {
        return val ? "true" : "false";
    } else if constexpr (HasContainerTraits<T>::value) {
        return "container";
    }
    return "other";
}
