#include "lib.h"

void LibDocument::Accept( LibPrinter* printer ) const
{
    printer->PushText( "doc" );
}

int LibDocument::Depth() const
{
    return 0;
}
