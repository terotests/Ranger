// A header shaped the way a shipped C++ library writes one: an export macro
// between `class` and the name, forward declarations up front, a friend
// declaration, `const T*` overloads, and members that are only declared here
// and defined in the .cpp.
#ifndef LIB_H
#define LIB_H

#define LIB_API

class LibDocument;
class LibPrinter;

class LIB_API LibPrinter
{
public:
    void PushText( const char* text );
};

class LIB_API LibNode
{
    friend class LibDocument;
public:
    const LibNode* Parent() const;
    LibNode* Parent();
    void Print( LibPrinter* printer ) const;

private:
    LibDocument* _document;
};

class LIB_API LibDocument : public LibNode
{
public:
    void Accept( LibPrinter* printer ) const;
    int Depth() const;
};

#endif
