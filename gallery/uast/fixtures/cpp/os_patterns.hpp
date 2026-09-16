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
