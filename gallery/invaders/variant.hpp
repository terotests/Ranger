// Variant header - maps mpark::variant to std::variant for C++17
#ifndef VARIANT_HPP
#define VARIANT_HPP

#include <variant>

namespace mpark {
    template<typename... Types>
    using variant = std::variant<Types...>;
    
    template<typename T, typename... Types>
    constexpr T& get(variant<Types...>& v) {
        return std::get<T>(v);
    }
    
    template<typename T, typename... Types>
    constexpr const T& get(const variant<Types...>& v) {
        return std::get<T>(v);
    }
}

#endif // VARIANT_HPP
